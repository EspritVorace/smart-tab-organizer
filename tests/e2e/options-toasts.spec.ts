/**
 * E2E Tests for in-page toasts (Options page)
 *
 * When an action is triggered from the Options page (import/export of rules,
 * import/export of sessions, snapshot, restore), user feedback is shown via
 * an in-page toast (<Toaster /> in src/components/UI/Toaster/) instead of a
 * native browser notification.
 *
 * Native notifications remain the channel for background events (grouping,
 * deduplication) -- tested separately in tests/e2e/notifications.spec.ts.
 */

import { test, expect } from './fixtures';

async function goToImportExportSection(page: any, extensionId: string): Promise<void> {
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(
    () => {
      const body = document.body.textContent ?? '';
      return !body.includes('Chargement') && body.length > 50;
    },
    null,
    { timeout: 10_000 },
  );
  await page.getByRole('button', { name: /import.*export/i }).click();
  await page.waitForTimeout(300);
}

async function seedDomainRules(extensionContext: any, rules: any[]): Promise<void> {
  const sw = extensionContext.serviceWorkers()[0];
  await sw.evaluate(async (r: any[]) => {
    await chrome.storage.sync.set({ domainRules: r });
  }, rules);
  await new Promise((r) => setTimeout(r, 200));
}

async function getSmartTabNotificationIds(extensionContext: any): Promise<string[]> {
  const sw = extensionContext.serviceWorkers()[0];
  const all: string[] = await sw.evaluate(async () => {
    return await new Promise<string[]>((resolve) => {
      chrome.notifications.getAll((n) => resolve(Object.keys(n ?? {})));
    });
  });
  return all.filter((id) => id.startsWith('smarttab-'));
}

test.describe('Options page toasts', () => {
  test('export to clipboard shows an in-page toast and no native notification', async ({
    extensionContext,
    extensionId,
  }) => {
    await seedDomainRules(extensionContext, [
      {
        id: 'toast-rule-1',
        label: 'Toast Test Rule',
        domainFilter: 'toast-test.com',
        enabled: true,
        groupingEnabled: true,
        deduplicationEnabled: false,
        deduplicationMatchMode: 'exact',
        groupNameSource: 'label',
        color: '',
        titleParsingRegEx: '',
        urlParsingRegEx: '',
        badge: '',
      },
    ]);

    const page = await extensionContext.newPage();
    await extensionContext.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: `chrome-extension://${extensionId}`,
    });

    await goToImportExportSection(page, extensionId);

    const notifBefore = await getSmartTabNotificationIds(extensionContext);

    // Open export wizard
    await page.getByRole('button', { name: /^export$/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Open the split-button dropdown and choose Clipboard
    await dialog.getByRole('button', { name: /export.*option|chevron/i }).click();
    await page.getByRole('menuitem', { name: /clipboard/i }).click();

    // In-page toast should appear
    const toast = page.getByTestId('toast-success');
    await expect(toast).toBeVisible({ timeout: 3000 });
    await expect(toast).toContainText(/export/i);

    // No new native notification
    const notifAfter = await getSmartTabNotificationIds(extensionContext);
    expect(notifAfter).toEqual(notifBefore);

    await page.close();
  });

  test('closing a toast removes it from the viewport', async ({
    extensionContext,
    extensionId,
  }) => {
    await seedDomainRules(extensionContext, [
      {
        id: 'toast-rule-2',
        label: 'Toast Close Rule',
        domainFilter: 'toast-close.com',
        enabled: true,
        groupingEnabled: true,
        deduplicationEnabled: false,
        deduplicationMatchMode: 'exact',
        groupNameSource: 'label',
        color: '',
        titleParsingRegEx: '',
        urlParsingRegEx: '',
        badge: '',
      },
    ]);

    const page = await extensionContext.newPage();
    await extensionContext.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: `chrome-extension://${extensionId}`,
    });

    await goToImportExportSection(page, extensionId);

    await page.getByRole('button', { name: /^export$/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.getByRole('button', { name: /export.*option|chevron/i }).click();
    await page.getByRole('menuitem', { name: /clipboard/i }).click();

    const toast = page.getByTestId('toast-success');
    await expect(toast).toBeVisible({ timeout: 3000 });

    await page.getByTestId('toast-btn-close').first().click();
    await expect(toast).toBeHidden({ timeout: 2000 });

    await page.close();
  });
});
