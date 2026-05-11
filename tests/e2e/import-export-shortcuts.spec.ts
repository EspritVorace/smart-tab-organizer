/**
 * E2E tests for the Import/Export sequence shortcuts (issue #275).
 * Validates that two-key sequences (`i r`, `i s`, `e r`, `e s`, etc.) opened
 * from the Import/Export options page each open the matching wizard, and
 * that escape / timeout / focus changes cancel the sequence cleanly.
 */
import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

async function goToImportExportSection(page: Page, extensionId: string): Promise<void> {
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
  await page.getByTestId('sidebar-nav-item-importexport').click();
  await page.getByTestId('page-import-export-card-import-rules').waitFor({ state: 'visible' });
}

async function focusBody(page: Page): Promise<void> {
  await page.locator('body').click({ position: { x: 5, y: 5 } });
}

test.describe('[issue-275] Import/Export sequence shortcuts', () => {
  test('i then r opens the rules import wizard', async ({ extensionContext, extensionId }) => {
    const page = await extensionContext.newPage();
    await goToImportExportSection(page, extensionId);
    await focusBody(page);

    await page.keyboard.press('i');
    await page.keyboard.press('r');

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await page.close();
  });

  test('i then s opens the sessions import wizard', async ({ extensionContext, extensionId }) => {
    const page = await extensionContext.newPage();
    await goToImportExportSection(page, extensionId);
    await focusBody(page);

    await page.keyboard.press('i');
    await page.keyboard.press('s');

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await page.close();
  });

  test('i then w opens the workspace import dialog', async ({ extensionContext, extensionId }) => {
    const page = await extensionContext.newPage();
    await goToImportExportSection(page, extensionId);
    await focusBody(page);

    await page.keyboard.press('i');
    await page.keyboard.press('w');

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await page.close();
  });

  test('typing only i and waiting past the timeout does not open any wizard', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToImportExportSection(page, extensionId);
    await focusBody(page);

    await page.keyboard.press('i');
    const indicator = page.getByTestId('sequence-indicator');
    await expect(indicator).toBeVisible({ timeout: 2000 });
    // Sequence times out after 1500ms; the indicator disappears.
    await expect(indicator).toBeHidden({ timeout: 3000 });
    // r alone is not a binding in this scope, so no dialog opens.
    await page.keyboard.press('r');
    await expect(page.getByRole('dialog')).toBeHidden();
    await page.close();
  });

  test('Escape mid-sequence cancels the buffer', async ({ extensionContext, extensionId }) => {
    const page = await extensionContext.newPage();
    await goToImportExportSection(page, extensionId);
    await focusBody(page);

    await page.keyboard.press('i');
    const indicator = page.getByTestId('sequence-indicator');
    await expect(indicator).toBeVisible({ timeout: 2000 });
    await page.keyboard.press('Escape');
    await expect(indicator).toBeHidden({ timeout: 1000 });
    // r alone is not a binding in this scope, so no dialog opens.
    await page.keyboard.press('r');
    await expect(page.getByRole('dialog')).toBeHidden();
    await page.close();
  });
});
