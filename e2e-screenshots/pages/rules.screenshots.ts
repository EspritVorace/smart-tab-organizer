/**
 * Rules page screenshots (10 screens × 3 locales × 2 themes = 60 PNGs)
 *
 * Selectors are kept locale-agnostic wherever possible (positional, role-based,
 * data-attribute) so they work identically for en / fr / es projects.
 *
 * Wizard navigation:
 *   Step 1 (identity)  — opens immediately on "Add Rule"
 *   Step 2 (config)    — reached after filling step 1 + clicking Next
 *   Step 3 (options)   — reached after clicking Next on step 2
 *   Step 4 (summary)   — reached after clicking Next on step 3
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

/** Open the "Add Rule" dialog (step 1 — identity). */
async function openAddRuleDialog(page: import('@playwright/test').Page) {
  await page.locator('main button.rt-Button').last().click();
  await page.waitForTimeout(400);
}

/**
 * Navigate from step 1 to step 2 by filling valid fields and clicking Next.
 * Uses a unique label to avoid uniqueness-validation failures.
 */
async function advanceToStep2(page: import('@playwright/test').Page, label = 'Screenshot Rule') {
  const dialog = page.locator('[role="dialog"]');
  await dialog.locator('input[name="label"]').fill(label);
  await dialog.locator('input[name="domainFilter"]').fill('screenshot.com');
  // Click Next button — last button in dialog footer at step 1
  await dialog.getByRole('button', { name: /next/i }).click();
  await page.waitForTimeout(400);
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
   * rules-create-step1
   * Wizard open at step 1 — identity fields visible.
   */
  test('rules-create-step1', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedRules(extensionContext);

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'rules',
      'rules-create-step1',
      async (page) => {
        await openAddRuleDialog(page);
        // Dialog is at step 1 — just capture as-is
      },
    );
  });

  /**
   * rules-create-preset
   * Wizard step 2 open, Preset mode selected (default), info HoverCard visible.
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
        await openAddRuleDialog(page);
        await advanceToStep2(page);

        // Preset is the default mode (index 0). Hover over its (i) icon to
        // reveal the HoverCard description.
        const items = page.locator('[role="dialog"] button.rt-SegmentedControlItem');
        await items.nth(0).locator('svg').first().hover();
        await page.waitForTimeout(500);
      },
    );
  });

  /**
   * rules-create-ask
   * Wizard step 2 open, Ask mode selected, info HoverCard visible.
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
        await openAddRuleDialog(page);
        await advanceToStep2(page);

        // SegmentedControl order: preset(0) · ask(1) · manual(2)
        const items = page.locator('[role="dialog"] button.rt-SegmentedControlItem');
        await items.nth(1).click();
        await page.waitForTimeout(200);
        await items.nth(1).locator('svg').first().hover();
        await page.waitForTimeout(500);
      },
    );
  });

  /**
   * rules-create-manual
   * Wizard step 2 open, Manual mode selected, info HoverCard visible.
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
        await openAddRuleDialog(page);
        await advanceToStep2(page);

        const items = page.locator('[role="dialog"] button.rt-SegmentedControlItem');
        await items.last().click();
        await page.waitForTimeout(200);
        await items.last().locator('svg').first().hover();
        await page.waitForTimeout(500);
      },
    );
  });

  /**
   * rules-create-summary
   * Wizard step 4 (summary) — rule data in read-only sections, Create button.
   */
  test('rules-create-summary', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedRules(extensionContext);

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'rules',
      'rules-create-summary',
      async (page) => {
        await openAddRuleDialog(page);
        // Step 1 → step 2
        await advanceToStep2(page, 'Summary Screenshot Rule');

        const dialog = page.locator('[role="dialog"]');
        // Switch to Ask mode so no preset selection is required
        await dialog.locator('button.rt-SegmentedControlItem').nth(1).click();
        await page.waitForTimeout(200);

        // Step 2 → step 3 → step 4
        await dialog.getByRole('button', { name: /next/i }).click();
        await dialog.locator('.rt-Switch').waitFor({ state: 'visible' });
        await dialog.getByRole('button', { name: /next/i }).click();
        await dialog.getByRole('button', { name: /create/i }).waitFor({ state: 'visible' });
        await page.waitForTimeout(300);
      },
    );
  });

  /**
   * rules-edit
   * Edit mode — summary view with identity fields, config text and pencil, options collapsible.
   */
  test('rules-edit', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedRules(extensionContext);

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'rules',
      'rules-edit',
      async (page) => {
        // Open edit modal for the first seeded rule (Jira)
        const rows = page.locator('[role="row"]');
        await rows.first().getByLabel(/more actions/i).click();
        await page.getByRole('menuitem', { name: /edit/i }).click();
        await page.locator('[role="dialog"]').waitFor({ state: 'visible' });
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
        const checkboxes = page.locator('[role="row"] button[role="checkbox"], [role="row"] input[type="checkbox"]');
        const count = await checkboxes.count();
        if (count >= 2) {
          await checkboxes.nth(0).click();
          await checkboxes.nth(1).click();
        } else {
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
        const exportBtn = page.locator('.rt-Card').first().getByRole('button').first();
        await exportBtn.click();
        await page.waitForTimeout(400);

        const dialog = page.locator('[role="dialog"]');
        await dialog.waitFor({ state: 'visible' });

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
        const importBtn = page.locator('.rt-Card').nth(1).getByRole('button').first();
        await importBtn.click();
        await page.waitForTimeout(500);
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
        const importBtn = page.locator('.rt-Card').nth(1).getByRole('button').first();
        await importBtn.click();
        const dialog = page.locator('[role="dialog"]');
        await dialog.waitFor({ state: 'visible' });
        await page.waitForTimeout(300);

        await dialog.locator('button.rt-SegmentedControlItem').nth(1).click();
        await page.waitForTimeout(400);

        const textarea = page.locator('textarea');
        await textarea.waitFor({ state: 'visible', timeout: 4_000 });
        await textarea.fill(conflictJson);

        await page.waitForFunction(
          () => {
            const btns = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'));
            const last = btns[btns.length - 1];
            return last != null && !last.disabled && last.getAttribute('data-disabled') !== 'true';
          },
          { timeout: 5_000 },
        ).catch(() => {});

        await dialog.getByRole('button').last().click();
        await page.waitForTimeout(800);
      },
    );
  });
});
