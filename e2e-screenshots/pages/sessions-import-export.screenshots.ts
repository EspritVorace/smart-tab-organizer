/**
 * Sessions import/export screenshots (3 screens × 3 locales × 2 themes = 18 PNGs)
 *
 * Covers the two new cards added to the Import/Export page by US-IE010–IE014:
 *   - Export Sessions dialog with SplitButton dropdown open
 *   - Import Sessions dialog, step 0 in file mode
 *   - Import Sessions dialog, step 0 with inline classification visible
 *     (new / conflicting / identical groups)
 *
 * Card order on the importexport page:
 *   nth(0) Export Rules
 *   nth(1) Import Rules
 *   nth(2) Export Sessions   ← these tests
 *   nth(3) Import Sessions   ← these tests
 */
import { test } from '../helpers/screenshot-fixture.js';
import { captureAll } from '../helpers/screenshot-helper.js';
import {
  seedSessions,
  clearSessions,
  ALL_SESSIONS,
} from '../fixtures/sessions-seed.js';
import { buildSessionConflictJson } from '../fixtures/sessions-import-conflicts-seed.js';

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Sessions import/export screenshots', () => {
  test.beforeEach(async ({ extensionContext }) => {
    await clearSessions(extensionContext);
  });

  /**
   * sessions-export-split-button
   * Import/Export page → Export Sessions dialog open → SplitButton dropdown open.
   */
  test('sessions-export-split-button', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedSessions(extensionContext, ALL_SESSIONS);

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'importexport',
      'sessions-export-split-button',
      async (page) => {
        const exportBtn = page.locator('.rt-Card').nth(2).getByRole('button').first();
        await exportBtn.click();
        await page.waitForTimeout(400);

        const dialog = page.locator('[role="dialog"]');
        await dialog.waitFor({ state: 'visible' });

        // Fill in the export note
        const noteField = dialog.locator('textarea');
        await noteField.fill('Full backup before OS reinstall');
        await page.waitForTimeout(200);

        // Open the SplitButton dropdown (last button in the dialog footer)
        const chevron = dialog.getByRole('button').last();
        await chevron.click();
        await page.waitForTimeout(400);
      },
    );
  });

  /**
   * sessions-import-file-dialog
   * Import/Export page → Import Sessions dialog open, file mode (default), step 0.
   */
  test('sessions-import-file-dialog', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedSessions(extensionContext, ALL_SESSIONS);

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'importexport',
      'sessions-import-file-dialog',
      async (page) => {
        const importBtn = page.locator('.rt-Card').nth(3).getByRole('button').first();
        await importBtn.click();
        await page.waitForTimeout(500);
        await page.locator('[role="dialog"]').waitFor({ state: 'visible' });
      },
    );
  });

  /**
   * sessions-import-text-conflicts
   * Import Sessions dialog → text mode → paste conflict JSON → click Next
   * → step 1 shows classification (new / conflicting / identical session groups).
   */
  test('sessions-import-text-conflicts', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedSessions(extensionContext, ALL_SESSIONS);
    const conflictJson = buildSessionConflictJson();

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'importexport',
      'sessions-import-text-conflicts',
      async (page) => {
        const importBtn = page.locator('.rt-Card').nth(3).getByRole('button').first();
        await importBtn.click();
        const dialog = page.locator('[role="dialog"]');
        await dialog.waitFor({ state: 'visible' });
        await page.waitForTimeout(300);

        // Switch to text mode (second SegmentedControlItem)
        await dialog.locator('button.rt-SegmentedControlItem').nth(1).click();
        await page.waitForTimeout(400);

        // Fill textarea with the sessions JSON array
        const textarea = page.locator('textarea');
        await textarea.waitFor({ state: 'visible', timeout: 4_000 });
        await textarea.fill(conflictJson);

        // Wait for Next button to become enabled (JSON valid → count shown)
        await page.waitForFunction(
          () => {
            const btns = Array.from(
              document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'),
            );
            const last = btns[btns.length - 1];
            return (
              last != null &&
              !last.disabled &&
              last.getAttribute('data-disabled') !== 'true'
            );
          },
          { timeout: 5_000 },
        ).catch(() => {});
        await page.waitForTimeout(400);

        // Click Next → moves to step 1 with classification
        const nextBtn = dialog.getByRole('button').last();
        await nextBtn.click();

        // Wait for classification sections to render
        await page.waitForTimeout(600);
      },
    );
  });
});
