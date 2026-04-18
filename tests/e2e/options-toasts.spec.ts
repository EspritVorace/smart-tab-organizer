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
 *
 * The import rules flow (Text mode paste + Next + Import) is the simplest
 * user trigger that produces a toast without needing any browser permission
 * (clipboard, filesystem...). We use it to assert toast behaviour.
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
  await page.getByTestId('page-import-export-card-import-rules').waitFor({ state: 'visible' });
}

async function clearDomainRules(extensionContext: any): Promise<void> {
  const sw = extensionContext.serviceWorkers()[0];
  await sw.evaluate(async () => {
    await chrome.storage.sync.set({ domainRules: [] });
  });
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

function makeRuleJson(label: string, domainFilter: string): string {
  return JSON.stringify({
    domainRules: [
      {
        id: `toast-${Date.now()}`,
        label,
        domainFilter,
        enabled: true,
        deduplicationEnabled: false,
        deduplicationMatchMode: 'exact',
        groupNameSource: 'title',
        presetId: null,
        color: 'blue',
        titleParsingRegEx: '',
        urlParsingRegEx: '',
        badge: '',
      },
    ],
  });
}

async function submitTextImport(page: any, json: string): Promise<void> {
  await page.getByTestId('page-import-export-card-import-rules').getByRole('button', { name: /^import$/i }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 5000 });
  await dialog.getByRole('radio', { name: 'Text' }).locator('..').click();
  await dialog.locator('textarea').fill(json);
  await expect(dialog.getByRole('button', { name: /next/i })).toBeEnabled();
  await dialog.getByRole('button', { name: /next/i }).click();
  await expect(dialog.getByRole('button', { name: /confirm.*import/i })).toBeVisible();
  await dialog.getByRole('button', { name: /confirm.*import/i }).click();
}

test.describe('Options page toasts', () => {
  test.beforeEach(async ({ extensionContext }) => {
    await clearDomainRules(extensionContext);
  });

  test('rule import shows an in-page toast and no native notification', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToImportExportSection(page, extensionId);

    const notifBefore = await getSmartTabNotificationIds(extensionContext);

    await submitTextImport(page, makeRuleJson('Toast Rule', 'toast-visible.com'));

    const toast = page.getByTestId('toast-success');
    await expect(toast).toBeVisible({ timeout: 3000 });

    const notifAfter = await getSmartTabNotificationIds(extensionContext);
    expect(notifAfter).toEqual(notifBefore);

    await page.close();
  });

  test('closing a toast removes it from the viewport', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToImportExportSection(page, extensionId);

    await submitTextImport(page, makeRuleJson('Toast Close Rule', 'toast-close.com'));

    const toast = page.getByTestId('toast-success');
    await expect(toast).toBeVisible({ timeout: 3000 });

    await page.getByTestId('toast-btn-close').first().click();
    await expect(toast).toBeHidden({ timeout: 2000 });

    await page.close();
  });
});
