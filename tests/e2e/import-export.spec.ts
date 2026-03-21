/**
 * E2E Tests for Import/Export Wizard (US-IE001 to US-IE009)
 *
 * Tests the complete Import and Export flow via the Options page UI:
 * - US-IE001: JSON source selection (File vs Text mode)
 * - US-IE002: JSON validation feedback (invalid JSON, schema errors, success indicator)
 * - US-IE003: Rule classification (new / conflicting / identical)
 * - US-IE004: Individual rule selection for new rules
 * - US-IE005: Global conflict resolution mode (overwrite / duplicate / ignore)
 * - US-IE006: Diff visualization for conflicting rules
 * - US-IE007: Import confirmation summary and success notification
 * - US-IE008: Export rule selection (select all / deselect all / individual)
 * - US-IE009: Export to file or clipboard, dialog closes on success
 */

import { test, expect } from './fixtures';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Navigate to the Import/Export section of the options page and wait for it to load. */
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

  // Click the "Import / Export" sidebar item
  await page.getByRole('button', { name: /import.*export/i }).click();
  await page.waitForTimeout(300);
}

/** A minimal valid rule JSON for import testing. */
function makeRuleJson(label: string, domainFilter: string): string {
  return JSON.stringify({
    domainRules: [
      {
        id: `test-rule-${Date.now()}`,
        label,
        domainFilter,
        enabled: true,
        groupingEnabled: true,
        deduplicationEnabled: false,
        deduplicationMatchMode: 'exact',
        groupNameSource: 'label',
        color: 'blue',
        titleParsingRegEx: '',
        urlParsingRegEx: '',
        badge: '',
      },
    ],
  });
}

/** Seed domain rules directly into storage. */
async function seedDomainRules(extensionContext: any, rules: any[]): Promise<void> {
  const sw = extensionContext.serviceWorkers()[0];
  await sw.evaluate(async (r: any[]) => {
    await chrome.storage.sync.set({ domainRules: r });
  }, rules);
  await new Promise(r => setTimeout(r, 200));
}

/** Clear all domain rules from storage. */
async function clearDomainRules(extensionContext: any): Promise<void> {
  const sw = extensionContext.serviceWorkers()[0];
  await sw.evaluate(async () => {
    await chrome.storage.sync.set({ domainRules: [] });
  });
  await new Promise(r => setTimeout(r, 200));
}

/** Open the Import wizard dialog from the Import/Export page. */
async function openImportWizard(page: any): Promise<void> {
  await page.getByRole('button', { name: /^import$/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
}

/** Open the Export wizard dialog from the Import/Export page. */
async function openExportWizard(page: any): Promise<void> {
  await page.getByRole('button', { name: /^export$/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
}

// ─── suite ──────────────────────────────────────────────────────────────────

test.describe('Import / Export', () => {
  test.beforeEach(async ({ extensionContext }) => {
    await clearDomainRules(extensionContext);
  });

  // ── US-IE001: JSON source selection ─────────────────────────────────────

  test.describe('JSON Source Selection [US-IE001]', () => {
    test('Import wizard shows File and Text mode tabs [US-IE001]', async ({
      extensionContext,
      extensionId,
    }) => {
      const page = await extensionContext.newPage();
      await goToImportExportSection(page, extensionId);
      await openImportWizard(page);

      const dialog = page.getByRole('dialog');
      // Both mode tabs should be visible
      await expect(dialog.getByText('File')).toBeVisible();
      await expect(dialog.getByText('Text')).toBeVisible();

      await page.close();
    });

    test('File mode shows a drop zone with Browse button [US-IE001]', async ({
      extensionContext,
      extensionId,
    }) => {
      const page = await extensionContext.newPage();
      await goToImportExportSection(page, extensionId);
      await openImportWizard(page);

      const dialog = page.getByRole('dialog');
      // Default mode is File — should show drag-drop zone text and Browse button
      await expect(dialog.getByText(/drag/i)).toBeVisible();
      await expect(dialog.getByRole('button', { name: /browse/i })).toBeVisible();

      await page.close();
    });

    test('switching to Text mode shows a textarea for raw JSON [US-IE001]', async ({
      extensionContext,
      extensionId,
    }) => {
      const page = await extensionContext.newPage();
      await goToImportExportSection(page, extensionId);
      await openImportWizard(page);

      const dialog = page.getByRole('dialog');
      // Switch to Text mode
      await dialog.getByText('Text').click();
      await page.waitForTimeout(200);

      await expect(dialog.locator('textarea')).toBeVisible();

      await page.close();
    });

    test('Next button is disabled when no JSON has been loaded [US-IE001]', async ({
      extensionContext,
      extensionId,
    }) => {
      const page = await extensionContext.newPage();
      await goToImportExportSection(page, extensionId);
      await openImportWizard(page);

      const dialog = page.getByRole('dialog');
      const nextBtn = dialog.getByRole('button', { name: /next/i });
      await expect(nextBtn).toBeDisabled();

      await page.close();
    });
  });

  // ── US-IE002: JSON validation feedback ──────────────────────────────────

  test.describe('JSON Validation [US-IE002]', () => {
    test('shows error callout for syntactically invalid JSON [US-IE002]', async ({
      extensionContext,
      extensionId,
    }) => {
      const page = await extensionContext.newPage();
      await goToImportExportSection(page, extensionId);
      await openImportWizard(page);

      const dialog = page.getByRole('dialog');
      await dialog.getByText('Text').click();
      await page.waitForTimeout(200);

      // Enter invalid JSON
      await dialog.locator('textarea').fill('{ invalid json }');
      await page.waitForTimeout(300);

      // Should show an error indicator
      await expect(dialog.getByText(/invalid/i)).toBeVisible();

      await page.close();
    });

    test('shows success indicator for valid JSON with rules [US-IE002]', async ({
      extensionContext,
      extensionId,
    }) => {
      const page = await extensionContext.newPage();
      await goToImportExportSection(page, extensionId);
      await openImportWizard(page);

      const dialog = page.getByRole('dialog');
      await dialog.getByText('Text').click();
      await page.waitForTimeout(200);

      const validJson = makeRuleJson('Valid Rule', 'valid.com');
      await dialog.locator('textarea').fill(validJson);
      await page.waitForTimeout(300);

      // Should show success: "1 rule(s) found"
      await expect(dialog.getByText(/1 rule/i)).toBeVisible();
      // Next button should now be enabled
      await expect(dialog.getByRole('button', { name: /next/i })).toBeEnabled();

      await page.close();
    });

    test('clearing the text field removes validation feedback [US-IE002]', async ({
      extensionContext,
      extensionId,
    }) => {
      const page = await extensionContext.newPage();
      await goToImportExportSection(page, extensionId);
      await openImportWizard(page);

      const dialog = page.getByRole('dialog');
      await dialog.getByText('Text').click();
      await page.waitForTimeout(200);

      await dialog.locator('textarea').fill('{ invalid }');
      await page.waitForTimeout(200);
      await expect(dialog.getByText(/invalid/i)).toBeVisible();

      // Clear the textarea
      await dialog.locator('textarea').fill('');
      await page.waitForTimeout(200);

      // No error and no success indicator
      await expect(dialog.getByText(/invalid/i)).not.toBeVisible();
      await expect(dialog.getByText(/rule.*found/i)).not.toBeVisible();

      await page.close();
    });
  });

  // ── US-IE003: Rule classification ───────────────────────────────────────

  test.describe('Rule Classification [US-IE003]', () => {
    test('classifies imported rules as New when no existing rule has the same label [US-IE003]', async ({
      extensionContext,
      extensionId,
    }) => {
      const page = await extensionContext.newPage();
      await goToImportExportSection(page, extensionId);
      await openImportWizard(page);

      const dialog = page.getByRole('dialog');
      await dialog.getByText('Text').click();
      await page.waitForTimeout(200);

      await dialog.locator('textarea').fill(makeRuleJson('Brand New Rule', 'brandnew.com'));
      await page.waitForTimeout(300);

      await dialog.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(300);

      // Should show "New rules (1)"
      await expect(dialog.getByText(/new rules.*1/i)).toBeVisible();

      await page.close();
    });

    test('classifies imported rules as Identical when the same rule already exists [US-IE003]', async ({
      extensionContext,
      extensionId,
    }) => {
      // Seed an existing rule
      const existing = {
        id: 'rule-identical',
        label: 'Identical Rule',
        domainFilter: 'identical.com',
        enabled: true,
        groupingEnabled: true,
        deduplicationEnabled: false,
        deduplicationMatchMode: 'exact',
        groupNameSource: 'label',
        color: 'blue',
        titleParsingRegEx: '',
        urlParsingRegEx: '',
        badge: '',
      };
      await seedDomainRules(extensionContext, [existing]);

      const page = await extensionContext.newPage();
      await goToImportExportSection(page, extensionId);
      await openImportWizard(page);

      const dialog = page.getByRole('dialog');
      await dialog.getByText('Text').click();
      await page.waitForTimeout(200);

      // Import same rule (same label + same properties)
      await dialog.locator('textarea').fill(
        JSON.stringify({ domainRules: [existing] }),
      );
      await page.waitForTimeout(300);

      await dialog.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(300);

      // Should show identical rules group
      await expect(dialog.getByText(/identical rules.*1/i)).toBeVisible();
      // Should show "Already exists" badge
      await expect(dialog.getByText(/already exists/i)).toBeVisible();

      await page.close();
    });

    test('classifies imported rules as Conflicting when label matches but properties differ [US-IE003]', async ({
      extensionContext,
      extensionId,
    }) => {
      const existing = {
        id: 'rule-conflict',
        label: 'Conflict Rule',
        domainFilter: 'conflict.com',
        enabled: true,
        groupingEnabled: true,
        deduplicationEnabled: false,
        deduplicationMatchMode: 'exact',
        groupNameSource: 'label',
        color: 'blue',
        titleParsingRegEx: '',
        urlParsingRegEx: '',
        badge: '',
      };
      await seedDomainRules(extensionContext, [existing]);

      // Import same label but different domainFilter
      const imported = { ...existing, id: 'rule-conflict-new', color: 'red' };

      const page = await extensionContext.newPage();
      await goToImportExportSection(page, extensionId);
      await openImportWizard(page);

      const dialog = page.getByRole('dialog');
      await dialog.getByText('Text').click();
      await page.waitForTimeout(200);

      await dialog.locator('textarea').fill(JSON.stringify({ domainRules: [imported] }));
      await page.waitForTimeout(300);

      await dialog.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(300);

      // Should show conflicting rules group
      await expect(dialog.getByText(/conflicting rules.*1/i)).toBeVisible();

      await page.close();
    });
  });

  // ── US-IE004: Individual selection of new rules ──────────────────────────

  test.describe('Individual Rule Selection [US-IE004]', () => {
    test('new rules are pre-selected by default [US-IE004]', async ({
      extensionContext,
      extensionId,
    }) => {
      const page = await extensionContext.newPage();
      await goToImportExportSection(page, extensionId);
      await openImportWizard(page);

      const dialog = page.getByRole('dialog');
      await dialog.getByText('Text').click();
      await page.waitForTimeout(200);

      await dialog.locator('textarea').fill(makeRuleJson('Pre-Selected Rule', 'preselect.com'));
      await page.waitForTimeout(300);

      await dialog.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(300);

      // The rule row's checkbox should be checked (role=checkbox)
      const checkboxes = dialog.getByRole('checkbox');
      const checkedCount = await checkboxes.evaluateAll(
        (els: Element[]) => els.filter((el: any) => el.checked || el.getAttribute('data-state') === 'checked').length,
      );
      expect(checkedCount).toBeGreaterThan(0);

      // Count should show at least 1 rule to import
      await expect(dialog.getByText(/1 rule.*import/i)).toBeVisible();

      await page.close();
    });

    test('Next button is disabled when all new rules are deselected [US-IE004]', async ({
      extensionContext,
      extensionId,
    }) => {
      const page = await extensionContext.newPage();
      await goToImportExportSection(page, extensionId);
      await openImportWizard(page);

      const dialog = page.getByRole('dialog');
      await dialog.getByText('Text').click();
      await page.waitForTimeout(200);

      await dialog.locator('textarea').fill(makeRuleJson('Deselect Rule', 'deselect.com'));
      await page.waitForTimeout(300);

      await dialog.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(300);

      // Deselect the rule
      await dialog.getByRole('checkbox').first().click();
      await page.waitForTimeout(200);

      // "0 rule(s) to import" and Next disabled
      await expect(dialog.getByText(/0 rule.*import/i)).toBeVisible();
      await expect(dialog.getByRole('button', { name: /next/i })).toBeDisabled();

      await page.close();
    });
  });

  // ── US-IE005: Global conflict resolution ────────────────────────────────

  test.describe('Conflict Resolution Modes [US-IE005]', () => {
    test('conflict resolution mode selector shows Overwrite / Duplicate / Ignore options [US-IE005]', async ({
      extensionContext,
      extensionId,
    }) => {
      const existing = {
        id: 'rule-cr',
        label: 'CR Rule',
        domainFilter: 'cr.com',
        enabled: true,
        groupingEnabled: true,
        deduplicationEnabled: false,
        deduplicationMatchMode: 'exact',
        groupNameSource: 'label',
        color: 'blue',
        titleParsingRegEx: '',
        urlParsingRegEx: '',
        badge: '',
      };
      await seedDomainRules(extensionContext, [existing]);

      const imported = { ...existing, id: 'rule-cr-new', color: 'green' };

      const page = await extensionContext.newPage();
      await goToImportExportSection(page, extensionId);
      await openImportWizard(page);

      const dialog = page.getByRole('dialog');
      await dialog.getByText('Text').click();
      await page.waitForTimeout(200);

      await dialog.locator('textarea').fill(JSON.stringify({ domainRules: [imported] }));
      await page.waitForTimeout(300);

      await dialog.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(300);

      // The conflict resolution segmented control should be visible
      await expect(dialog.getByText('Overwrite')).toBeVisible();
      await expect(dialog.getByText('Duplicate')).toBeVisible();
      await expect(dialog.getByText('Ignore')).toBeVisible();

      await page.close();
    });

    test('Ignore mode: conflicting rule count is excluded from import count [US-IE005]', async ({
      extensionContext,
      extensionId,
    }) => {
      const existing = {
        id: 'rule-ignore',
        label: 'Ignore Rule',
        domainFilter: 'ignore.com',
        enabled: true,
        groupingEnabled: true,
        deduplicationEnabled: false,
        deduplicationMatchMode: 'exact',
        groupNameSource: 'label',
        color: 'blue',
        titleParsingRegEx: '',
        urlParsingRegEx: '',
        badge: '',
      };
      await seedDomainRules(extensionContext, [existing]);

      const imported = { ...existing, id: 'rule-ignore-new', color: 'red' };

      const page = await extensionContext.newPage();
      await goToImportExportSection(page, extensionId);
      await openImportWizard(page);

      const dialog = page.getByRole('dialog');
      await dialog.getByText('Text').click();
      await page.waitForTimeout(200);

      await dialog.locator('textarea').fill(JSON.stringify({ domainRules: [imported] }));
      await page.waitForTimeout(300);

      await dialog.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(300);

      // Switch to Ignore mode
      await dialog.getByText('Ignore').click();
      await page.waitForTimeout(200);

      // Import count should be 0 (conflict ignored, no new rules)
      await expect(dialog.getByText(/0 rule.*import/i)).toBeVisible();

      await page.close();
    });
  });

  // ── US-IE006: Diff visualization ────────────────────────────────────────

  test.describe('Conflict Diff Visualization [US-IE006]', () => {
    test('conflicting rule shows a "View differences" / eye icon button [US-IE006]', async ({
      extensionContext,
      extensionId,
    }) => {
      const existing = {
        id: 'rule-diff',
        label: 'Diff Rule',
        domainFilter: 'diff.com',
        enabled: true,
        groupingEnabled: true,
        deduplicationEnabled: false,
        deduplicationMatchMode: 'exact',
        groupNameSource: 'label',
        color: 'blue',
        titleParsingRegEx: '',
        urlParsingRegEx: '',
        badge: '',
      };
      await seedDomainRules(extensionContext, [existing]);

      const imported = { ...existing, id: 'rule-diff-new', color: 'green' };

      const page = await extensionContext.newPage();
      await goToImportExportSection(page, extensionId);
      await openImportWizard(page);

      const dialog = page.getByRole('dialog');
      await dialog.getByText('Text').click();
      await page.waitForTimeout(200);

      await dialog.locator('textarea').fill(JSON.stringify({ domainRules: [imported] }));
      await page.waitForTimeout(300);

      await dialog.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(300);

      // There should be a button to view differences (aria-label or title containing "diff" / "view")
      // The Eye icon button may have an accessible label
      const diffBtn = dialog.getByRole('button', { name: /diff|view|see/i });
      await expect(diffBtn.first()).toBeVisible();

      await page.close();
    });
  });

  // ── US-IE007: Import confirmation and result ─────────────────────────────

  test.describe('Import Confirmation [US-IE007]', () => {
    test('confirmation step shows a summary of rules to be imported [US-IE007]', async ({
      extensionContext,
      extensionId,
    }) => {
      const page = await extensionContext.newPage();
      await goToImportExportSection(page, extensionId);
      await openImportWizard(page);

      const dialog = page.getByRole('dialog');
      await dialog.getByText('Text').click();
      await page.waitForTimeout(200);

      await dialog.locator('textarea').fill(makeRuleJson('Confirm Rule', 'confirm.com'));
      await page.waitForTimeout(300);

      // Step 1 → Step 2 (selection)
      await dialog.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(300);

      // Step 2 → Step 3 (confirmation)
      await dialog.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(300);

      // Should show some summary text
      await expect(dialog.getByText(/1/)).toBeVisible();

      await page.close();
    });

    test('wizard dialog closes after successful import [US-IE007]', async ({
      extensionContext,
      extensionId,
    }) => {
      const page = await extensionContext.newPage();
      await goToImportExportSection(page, extensionId);
      await openImportWizard(page);

      const dialog = page.getByRole('dialog');
      await dialog.getByText('Text').click();
      await page.waitForTimeout(200);

      await dialog.locator('textarea').fill(makeRuleJson('Import Close Rule', 'importclose.com'));
      await page.waitForTimeout(300);

      await dialog.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(300);
      await dialog.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(300);

      // Click Import (confirm button)
      await dialog.getByRole('button', { name: /^import$/i }).click();
      await page.waitForTimeout(1000);

      // Dialog should close after import
      await expect(page.getByRole('dialog')).not.toBeVisible();

      await page.close();
    });

    test('wizard state resets when reopened after import [US-IE007]', async ({
      extensionContext,
      extensionId,
    }) => {
      const page = await extensionContext.newPage();
      await goToImportExportSection(page, extensionId);

      // First import
      await openImportWizard(page);
      const dialog = page.getByRole('dialog');
      await dialog.getByText('Text').click();
      await page.waitForTimeout(200);
      await dialog.locator('textarea').fill(makeRuleJson('First Import', 'firstimport.com'));
      await page.waitForTimeout(300);
      await dialog.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(300);
      await dialog.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(300);
      await dialog.getByRole('button', { name: /^import$/i }).click();
      await page.waitForTimeout(1000);

      // Reopen wizard — should start fresh at step 1
      await openImportWizard(page);
      const dialog2 = page.getByRole('dialog');
      await expect(dialog2.getByText('Source')).toBeVisible();
      // Should be back at step 1 (file/text selector visible, not step 3 summary)
      await expect(dialog2.getByText('File')).toBeVisible();

      await page.close();
    });
  });

  // ── US-IE008: Export rule selection ─────────────────────────────────────

  test.describe('Export Rule Selection [US-IE008]', () => {
    test('all rules are pre-selected when Export wizard opens [US-IE008]', async ({
      extensionContext,
      extensionId,
    }) => {
      await seedDomainRules(extensionContext, [
        {
          id: 'r1',
          label: 'Rule One',
          domainFilter: 'one.com',
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
        {
          id: 'r2',
          label: 'Rule Two',
          domainFilter: 'two.com',
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
      await goToImportExportSection(page, extensionId);
      await openExportWizard(page);

      const dialog = page.getByRole('dialog');
      // Should show "2 rule(s) selected"
      await expect(dialog.getByText(/2 rule.*selected/i)).toBeVisible();

      await page.close();
    });

    test('Select All and Deselect All buttons work correctly [US-IE008]', async ({
      extensionContext,
      extensionId,
    }) => {
      await seedDomainRules(extensionContext, [
        {
          id: 'r3',
          label: 'Select All Test',
          domainFilter: 'selectall.com',
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
      await goToImportExportSection(page, extensionId);
      await openExportWizard(page);

      const dialog = page.getByRole('dialog');

      // Deselect All
      await dialog.getByRole('button', { name: /deselect all/i }).click();
      await page.waitForTimeout(200);
      await expect(dialog.getByText(/0 rule.*selected/i)).toBeVisible();

      // Next button should be disabled when nothing is selected
      await expect(dialog.getByRole('button', { name: /next/i })).toBeDisabled();

      // Select All
      await dialog.getByRole('button', { name: /select all/i }).click();
      await page.waitForTimeout(200);
      await expect(dialog.getByText(/1 rule.*selected/i)).toBeVisible();
      await expect(dialog.getByRole('button', { name: /next/i })).toBeEnabled();

      await page.close();
    });

    test('Next button is disabled when no rules are selected [US-IE008]', async ({
      extensionContext,
      extensionId,
    }) => {
      await seedDomainRules(extensionContext, [
        {
          id: 'r4',
          label: 'No Select Test',
          domainFilter: 'noselect.com',
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
      await goToImportExportSection(page, extensionId);
      await openExportWizard(page);

      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: /deselect all/i }).click();
      await page.waitForTimeout(200);

      await expect(dialog.getByRole('button', { name: /next/i })).toBeDisabled();

      await page.close();
    });

    test('Export button is disabled on the Import/Export page when there are no rules [US-IE008]', async ({
      extensionContext,
      extensionId,
    }) => {
      // No rules seeded (cleared in beforeEach)
      const page = await extensionContext.newPage();
      await goToImportExportSection(page, extensionId);

      // Export button should be disabled when domainRules is empty
      const exportBtn = page.getByRole('button', { name: /^export$/i });
      await expect(exportBtn).toBeDisabled();

      await page.close();
    });
  });

  // ── US-IE009: Export to file or clipboard ───────────────────────────────

  test.describe('Export Output [US-IE009]', () => {
    test('Export wizard second step shows rules ready to export [US-IE009]', async ({
      extensionContext,
      extensionId,
    }) => {
      await seedDomainRules(extensionContext, [
        {
          id: 'r5',
          label: 'Export Ready Rule',
          domainFilter: 'exportready.com',
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
      await goToImportExportSection(page, extensionId);
      await openExportWizard(page);

      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(300);

      // Should show "1 rule(s) ready to export"
      await expect(dialog.getByText(/1 rule.*export/i)).toBeVisible();

      await page.close();
    });

    test('Export step has a split button with Export and chevron/dropdown [US-IE009]', async ({
      extensionContext,
      extensionId,
    }) => {
      await seedDomainRules(extensionContext, [
        {
          id: 'r6',
          label: 'Split Button Rule',
          domainFilter: 'splitbtn.com',
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
      await goToImportExportSection(page, extensionId);
      await openExportWizard(page);

      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(300);

      // The SplitButton should have an Export button and a dropdown chevron button
      await expect(dialog.getByRole('button', { name: /^export$/i })).toBeVisible();
      // The split button dropdown trigger (chevron / "Export options")
      await expect(
        dialog.getByRole('button', { name: /export.*option|chevron|▾/i }),
      ).toBeVisible();

      await page.close();
    });

    test('Copy to Clipboard option is available in the export dropdown [US-IE009]', async ({
      extensionContext,
      extensionId,
    }) => {
      await seedDomainRules(extensionContext, [
        {
          id: 'r7',
          label: 'Clipboard Rule',
          domainFilter: 'clipboard.com',
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
      await goToImportExportSection(page, extensionId);
      await openExportWizard(page);

      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(300);

      // Open the export options dropdown
      await dialog.getByRole('button', { name: /export.*option|chevron/i }).click();
      await page.waitForTimeout(200);

      // Should show clipboard option
      await expect(page.getByRole('menuitem', { name: /clipboard/i })).toBeVisible();

      await page.close();
    });
  });
});
