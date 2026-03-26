/**
 * Rules page screenshots (8 screens × 3 locales × 2 themes = 48 PNGs)
 *
 * Selectors are kept locale-agnostic wherever possible (positional, role-based,
 * data-attribute) so they work identically for en / fr / es projects.
 */
import { test } from '../helpers/screenshot-fixture.js';
import { captureAll } from '../helpers/screenshot-helper.js';
import { seedRules, clearRules } from '../fixtures/rules-seed.js';
import { buildConflictJson } from '../fixtures/conflicts-seed.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Navigate to the Import/Export section and wait for it to render. */
async function goToImportExport(page: import('@playwright/test').Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/options.html#importexport`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(600);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Rules screenshots', () => {
  test.beforeEach(async ({ extensionContext }) => {
    await clearRules(extensionContext);
  });

  /**
   * rules-list
   * Full list with badges, toggles, category colours.
   */
  test('rules-list', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedRules(extensionContext);
    await captureAll(extensionContext, extensionId, locale, 'rules', 'rules-list');
  });

  /**
   * rules-create-preset
   * New-rule wizard open, Preset mode selected, preset list visible.
   */
  test('rules-create-preset', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedRules(extensionContext);

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'rules',
      'rules-create-preset',
      async (page) => {
        // Click the "Add Rule" button — it is the only non-search button in
        // the rules toolbar (the last button before the rule list).
        await page.locator('main button.rt-Button').last().click();
        await page.waitForTimeout(400);

        // The form modal opens. Look for the Preset mode option.
        // DomainRuleFormModal uses a SegmentedControl for mode selection;
        // the item with value="preset" is the preset mode.
        const presetItem = page
          .locator('[role="dialog"]')
          .locator('[data-value="preset"], button')
          .filter({ hasText: /preset/i })
          .first();
        await presetItem.click().catch(() => {
          // Fallback: click the second segmented-control item
          return page.locator('[role="dialog"] button.rt-SegmentedControlItem').nth(1).click();
        });
        await page.waitForTimeout(500);
      },
    );
  });

  /**
   * rules-create-ask
   * New-rule wizard open, smart_manual ("ask") mode selected.
   */
  test('rules-create-ask', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedRules(extensionContext);

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'rules',
      'rules-create-ask',
      async (page) => {
        await page.locator('main button.rt-Button').last().click();
        await page.waitForTimeout(400);

        // Select the "Smart / Ask" mode (smart_manual). It is typically the
        // third or fourth segmented-control item in the form modal.
        const items = page.locator('[role="dialog"] button.rt-SegmentedControlItem');
        const count = await items.count();
        if (count >= 3) {
          await items.nth(2).click();
        }
        await page.waitForTimeout(500);
      },
    );
  });

  /**
   * rules-create-manual
   * New-rule wizard open, Manual mode, all fields visible, category selected.
   */
  test('rules-create-manual', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedRules(extensionContext);

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'rules',
      'rules-create-manual',
      async (page) => {
        await page.locator('main button.rt-Button').last().click();
        await page.waitForTimeout(400);

        // Select Manual mode (first or only non-preset segmented item).
        // In the DomainRuleFormModal the first item is typically "Manual".
        const items = page.locator('[role="dialog"] button.rt-SegmentedControlItem');
        await items.first().click();
        await page.waitForTimeout(300);

        // Open the category picker so it appears in the screenshot.
        const categoryBtn = page
          .locator('[role="dialog"]')
          .locator('button')
          .filter({ hasText: /categor|catégor|categor/i })
          .first();
        await categoryBtn.click().catch(() => {});
        await page.waitForTimeout(400);
      },
    );
  });

  /**
   * rules-bulk-actions
   * Two rules checked — bulk action bar visible.
   */
  test('rules-bulk-actions', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedRules(extensionContext);

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'rules',
      'rules-bulk-actions',
      async (page) => {
        // Rules are rendered as Cards with role="row". Each card has a Checkbox.
        // Click the first two checkboxes to trigger the bulk action bar.
        const checkboxes = page.locator('[role="row"] button[role="checkbox"], [role="row"] input[type="checkbox"]');
        const count = await checkboxes.count();
        if (count >= 2) {
          await checkboxes.nth(0).click();
          await checkboxes.nth(1).click();
        } else {
          // Fallback: try Radix checkbox elements
          const radixBoxes = page.locator('.rt-Checkbox');
          if (await radixBoxes.count() >= 2) {
            await radixBoxes.nth(0).click();
            await radixBoxes.nth(1).click();
          }
        }
        await page.waitForTimeout(400);
      },
    );
  });

  /**
   * rules-export-split-button
   * Import/Export page → Export dialog open → SplitButton dropdown open.
   */
  test('rules-export-split-button', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedRules(extensionContext);

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'importexport',
      'rules-export-split-button',
      async (page) => {
        // The Export card is the FIRST card on the import/export page.
        // Its button opens the ExportWizard dialog.
        const exportBtn = page.locator('.rt-Card').first().getByRole('button').first();
        await exportBtn.click();
        await page.waitForTimeout(400);

        // Inside the ExportWizard dialog, the SplitButton chevron (dropdown
        // trigger) is the last button in the dialog footer.
        const dialog = page.locator('[role="dialog"]');
        await dialog.waitFor({ state: 'visible' });

        // The SplitButton renders as two adjacent buttons; the chevron is last.
        const chevron = dialog.getByRole('button').last();
        await chevron.click();
        await page.waitForTimeout(400);
      },
    );
  });

  /**
   * rules-import-file-dialog
   * Import/Export page → Import dialog open, file mode (default), step 0.
   */
  test('rules-import-file-dialog', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedRules(extensionContext);

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'importexport',
      'rules-import-file-dialog',
      async (page) => {
        // The Import card is the SECOND card on the page.
        const importBtn = page.locator('.rt-Card').nth(1).getByRole('button').first();
        await importBtn.click();
        await page.waitForTimeout(500);
        // Dialog is now open at step 0 (file mode) — no further interaction needed.
        await page.locator('[role="dialog"]').waitFor({ state: 'visible' });
      },
    );
  });

  /**
   * rules-import-text-conflicts
   * Import dialog → text mode → paste conflict JSON → click Next → step 1
   * showing new / conflicting / identical rule groups.
   */
  test('rules-import-text-conflicts', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedRules(extensionContext);
    const conflictJson = buildConflictJson();

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'importexport',
      'rules-import-text-conflicts',
      async (page) => {
        // Open the Import dialog
        const importBtn = page.locator('.rt-Card').nth(1).getByRole('button').first();
        await importBtn.click();
        const dialog = page.locator('[role="dialog"]');
        await dialog.waitFor({ state: 'visible' });
        await page.waitForTimeout(300);

        // Switch to "Text" mode via the SegmentedControl
        // The item with value="text" or hasText matching "Text"/"Texte"/"Texto"
        const textItem = dialog
          .locator('[data-value="text"]')
          .or(dialog.locator('button.rt-SegmentedControlItem').nth(1));
        await textItem.first().click();
        await page.waitForTimeout(300);

        // Fill the textarea with the conflict JSON
        await dialog.locator('textarea').fill(conflictJson);
        await page.waitForTimeout(500);

        // Click "Next" — it is the last (primary action) button in the footer
        const nextBtn = dialog.getByRole('button').last();
        await nextBtn.click();
        await page.waitForTimeout(600);
      },
    );
  });
});
