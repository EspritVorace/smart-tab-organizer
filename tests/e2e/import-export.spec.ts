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
 *
 * Migrated to the Page Object / Domain Action architecture (lot 3).
 * Page Objects live in `e2e-shared/pages/`, composed flows in
 * `e2e-shared/actions/`.
 */
import type { BrowserContext, Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { auditPage } from './helpers/a11y';
import { goToImportExportSection } from './helpers/navigation';
import { ImportWizardPage } from '../../e2e-shared/pages/index.js';
import { openRulesImportWizard, openRulesExportWizard } from '../../e2e-shared/actions/index.js';

// ─── Local fixtures ─────────────────────────────────────────────────────────

interface SeedRule {
  id: string;
  label: string;
  domainFilter: string;
  enabled: boolean;
  deduplicationEnabled: boolean;
  deduplicationMatchMode: 'exact';
  groupNameSource: 'title' | 'label';
  presetId: string | null;
  color: string;
  titleParsingRegEx: string;
  urlParsingRegEx: string;
  badge: string;
  groupingEnabled?: boolean;
}

/** Build a minimal rule object usable both as a seed and as an import payload row. */
function makeRule(label: string, domainFilter: string, overrides: Partial<SeedRule> = {}): SeedRule {
  return {
    id: `test-rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
    ...overrides,
  };
}

/** Serialize one or more rules as the JSON payload expected by the importer. */
function makeRuleJson(...rules: SeedRule[]): string {
  return JSON.stringify({ domainRules: rules });
}

async function setStorage(context: BrowserContext, data: Record<string, unknown>): Promise<void> {
  const sw = context.serviceWorkers()[0];
  await sw.evaluate(async (d: Record<string, unknown>) => {
    await chrome.storage.local.set(d);
  }, data);
  await new Promise(r => setTimeout(r, 200));
}

const seedRules = (context: BrowserContext, rules: SeedRule[]) =>
  setStorage(context, { domainRules: rules });
const clearRules = (context: BrowserContext) => setStorage(context, { domainRules: [] });
const clearSessions = (context: BrowserContext) => setStorage(context, { sessions: [] });

// ─── Suite ──────────────────────────────────────────────────────────────────

test.describe('Import / Export', () => {
  test.beforeEach(async ({ extensionContext }) => {
    await clearRules(extensionContext);
  });

  // ── US-IE001: JSON source selection ─────────────────────────────────────

  test.describe('JSON Source Selection [US-IE001]', () => {
    test('Import wizard shows File and Text mode tabs [US-IE001]', async ({
      extensionPage,
      extensionId,
    }) => {
      await goToImportExportSection(extensionPage, extensionId);
      await auditPage(extensionPage, 'import-export-landing');
      const wizard = await openRulesImportWizard(extensionPage);

      await expect(wizard.dialog().getByRole('radio', { name: 'File' }).locator('..')).toBeVisible();
      await expect(wizard.dialog().getByRole('radio', { name: 'Text' }).locator('..')).toBeVisible();
      await auditPage(extensionPage, 'import-wizard-source-step', { include: '[role="dialog"]' });
    });

    test('File mode shows a drop zone with Browse button [US-IE001]', async ({
      extensionPage,
      extensionId,
    }) => {
      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesImportWizard(extensionPage);

      await expect(wizard.fileDropZone()).toBeVisible();
      await expect(wizard.browseButton()).toBeVisible();
    });

    test('switching to Text mode shows a textarea for raw JSON [US-IE001]', async ({
      extensionPage,
      extensionId,
    }) => {
      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesImportWizard(extensionPage);

      await wizard.selectTextMode();
      await expect(wizard.textArea()).toBeVisible();
    });

    test('Next button is disabled when no JSON has been loaded [US-IE001]', async ({
      extensionPage,
      extensionId,
    }) => {
      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesImportWizard(extensionPage);

      await expect(wizard.nextButton()).toBeDisabled();
    });
  });

  // ── US-IE002: JSON validation feedback ──────────────────────────────────

  test.describe('JSON Validation [US-IE002]', () => {
    test('shows error callout for syntactically invalid JSON [US-IE002]', async ({
      extensionPage,
      extensionId,
    }) => {
      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesImportWizard(extensionPage);

      await wizard.pasteJson('{ invalid json }');
      await wizard.expectInvalidJsonError();
    });

    test('shows success indicator for valid JSON with rules [US-IE002]', async ({
      extensionPage,
      extensionId,
    }) => {
      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesImportWizard(extensionPage);

      await wizard.pasteJson(makeRuleJson(makeRule('Valid Rule', 'valid.com')));
      await expect(wizard.dialog().getByText(/1 rule/i)).toBeVisible();
      await expect(wizard.nextButton()).toBeEnabled();
    });

    test('clearing the text field removes validation feedback [US-IE002]', async ({
      extensionPage,
      extensionId,
    }) => {
      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesImportWizard(extensionPage);

      await wizard.pasteJson('{ invalid }');
      await wizard.expectInvalidJsonError();

      await wizard.textArea().fill('');
      await expect(wizard.errorBanner()).toBeHidden();
      await expect(wizard.dialog().getByText(/rule.*found/i)).toBeHidden();
    });
  });

  // ── US-IE003: Rule classification ───────────────────────────────────────

  test.describe('Rule Classification [US-IE003]', () => {
    test('classifies imported rules as New when no existing rule has the same label [US-IE003]', async ({
      extensionPage,
      extensionId,
    }) => {
      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesImportWizard(extensionPage);

      await wizard.pasteJson(makeRuleJson(makeRule('Brand New Rule', 'brandnew.com')));
      await wizard.clickNext();
      await wizard.expectClassification({ new: 1 });
    });

    test('classifies imported rules as Identical when the same rule already exists [US-IE003]', async ({
      extensionContext,
      extensionPage,
      extensionId,
    }) => {
      const existing = makeRule('Identical Rule', 'identical.com', { id: 'rule-identical' });
      await seedRules(extensionContext, [existing]);

      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesImportWizard(extensionPage);

      await wizard.pasteJson(makeRuleJson(existing));
      await wizard.clickNext();
      await wizard.expectClassification({ identical: 1 });
      await expect(wizard.dialog().getByText(/already exists/i)).toBeVisible();
    });

    test('classifies imported rules as Conflicting when label matches but properties differ [US-IE003]', async ({
      extensionContext,
      extensionPage,
      extensionId,
    }) => {
      const existing = makeRule('Conflict Rule', 'conflict.com', { id: 'rule-conflict' });
      await seedRules(extensionContext, [existing]);

      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesImportWizard(extensionPage);

      await wizard.pasteJson(
        makeRuleJson({ ...existing, id: 'rule-conflict-new', color: 'red' }),
      );
      await wizard.clickNext();
      await wizard.expectClassification({ conflicting: 1 });
    });
  });

  // ── US-IE004: Individual selection of new rules ──────────────────────────

  test.describe('Individual Rule Selection [US-IE004]', () => {
    test('new rules are pre-selected by default [US-IE004]', async ({
      extensionPage,
      extensionId,
    }) => {
      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesImportWizard(extensionPage);

      await wizard.pasteJson(makeRuleJson(makeRule('Pre-Selected Rule', 'preselect.com')));
      await wizard.clickNext();

      const checkedCount = await wizard.selectionList().evaluateAll(
        (els: Element[]) =>
          els.filter((el: any) => el.checked || el.getAttribute('data-state') === 'checked').length,
      );
      expect(checkedCount).toBeGreaterThan(0);
      await expect(wizard.dialog().getByText(/1 rule.*import/i)).toBeVisible();
    });

    test('Confirm Import button is disabled when all new rules are deselected [US-IE004]', async ({
      extensionPage,
      extensionId,
    }) => {
      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesImportWizard(extensionPage);

      await wizard.pasteJson(makeRuleJson(makeRule('Deselect Rule', 'deselect.com')));
      await wizard.clickNext();

      // Each rule row checkbox carries the rule label as its aria-label.
      await wizard.dialog().getByRole('checkbox', { name: 'Deselect Rule' }).click();
      await expect(wizard.dialog().getByText(/0 rule.*import/i)).toBeVisible();
      await expect(wizard.confirmButton()).toBeDisabled();
    });
  });

  // ── US-IE005: Global conflict resolution ────────────────────────────────

  test.describe('Conflict Resolution Modes [US-IE005]', () => {
    async function setupConflict(
      context: BrowserContext,
      page: Page,
      extensionId: string,
      existing: SeedRule,
      importedOverrides: Partial<SeedRule>,
    ): Promise<ImportWizardPage> {
      await seedRules(context, [existing]);
      await goToImportExportSection(page, extensionId);
      const wizard = await openRulesImportWizard(page);
      await wizard.pasteJson(makeRuleJson({ ...existing, ...importedOverrides }));
      await wizard.clickNext();
      return wizard;
    }

    test('conflict resolution mode selector shows Overwrite / Duplicate / Ignore options [US-IE005]', async ({
      extensionContext,
      extensionPage,
      extensionId,
    }) => {
      const wizard = await setupConflict(
        extensionContext,
        extensionPage,
        extensionId,
        makeRule('CR Rule', 'cr.com', { id: 'rule-cr' }),
        { id: 'rule-cr-new', color: 'green' },
      );

      await expect(wizard.dialog().getByRole('radio', { name: 'Overwrite' })).toBeAttached();
      await expect(wizard.dialog().getByRole('radio', { name: 'Duplicate' })).toBeAttached();
      await expect(wizard.dialog().getByRole('radio', { name: 'Ignore' })).toBeAttached();
    });

    test('Ignore mode: conflicting rule count is excluded from import count [US-IE005]', async ({
      extensionContext,
      extensionPage,
      extensionId,
    }) => {
      const wizard = await setupConflict(
        extensionContext,
        extensionPage,
        extensionId,
        makeRule('Ignore Rule', 'ignore.com', { id: 'rule-ignore' }),
        { id: 'rule-ignore-new', color: 'red' },
      );

      // Target the SegmentedControl item directly: the rule-card text also
      // contains "Ignore" and would otherwise trigger a strict-mode violation.
      await wizard.dialog().locator('.rt-SegmentedControlItem').filter({ hasText: 'Ignore' }).first().click();
      await expect(wizard.dialog().getByText(/0 rule.*import/i)).toBeVisible();
    });
  });

  // ── US-IE006: Diff visualization ────────────────────────────────────────

  test.describe('Conflict Diff Visualization [US-IE006]', () => {
    test('conflicting rule shows a "View differences" / eye icon button [US-IE006]', async ({
      extensionContext,
      extensionPage,
      extensionId,
    }) => {
      const existing = makeRule('Diff Rule', 'diff.com', { id: 'rule-diff' });
      await seedRules(extensionContext, [existing]);

      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesImportWizard(extensionPage);
      await wizard.pasteJson(makeRuleJson({ ...existing, id: 'rule-diff-new', color: 'green' }));
      await wizard.clickNext();

      await expect(
        wizard.dialog().getByRole('button', { name: /diff|view|see/i }).first(),
      ).toBeVisible();
    });
  });

  // ── US-IE007: Import confirmation and result ─────────────────────────────

  test.describe('Import Confirmation [US-IE007]', () => {
    test('selection step shows rule count and Confirm Import button [US-IE007]', async ({
      extensionPage,
      extensionId,
    }) => {
      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesImportWizard(extensionPage);

      await wizard.pasteJson(makeRuleJson(makeRule('Confirm Rule', 'confirm.com')));
      await wizard.clickNext();
      await expect(wizard.dialog().getByText(/1 rule.*import/i)).toBeVisible();
      await expect(wizard.confirmButton()).toBeEnabled();
    });

    test('wizard dialog closes after successful import [US-IE007]', async ({
      extensionPage,
      extensionId,
    }) => {
      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesImportWizard(extensionPage);

      await wizard.pasteJson(makeRuleJson(makeRule('Import Close Rule', 'importclose.com')));
      await wizard.clickNext();
      await wizard.confirmImport();
      await wizard.expectHidden();
    });

    test('wizard state resets when reopened after import [US-IE007]', async ({
      extensionPage,
      extensionId,
    }) => {
      await goToImportExportSection(extensionPage, extensionId);

      const first = await openRulesImportWizard(extensionPage);
      await first.pasteJson(makeRuleJson(makeRule('First Import', 'firstimport.com')));
      await first.clickNext();
      await first.confirmImport();
      await first.expectHidden();

      const reopened = await openRulesImportWizard(extensionPage);
      await expect(reopened.dialog().getByRole('radio', { name: 'File' }).locator('..')).toBeVisible();
    });
  });

  // ── US-IE008: Export rule selection ─────────────────────────────────────

  test.describe('Export Rule Selection [US-IE008]', () => {
    test('all rules are pre-selected when Export wizard opens [US-IE008]', async ({
      extensionContext,
      extensionPage,
      extensionId,
    }) => {
      await seedRules(extensionContext, [
        makeRule('Rule One', 'one.com', { id: 'r1', groupingEnabled: true, groupNameSource: 'label' }),
        makeRule('Rule Two', 'two.com', { id: 'r2', groupingEnabled: true, groupNameSource: 'label' }),
      ]);

      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesExportWizard(extensionPage);
      await wizard.expectAllRulesSelected(2);
    });

    test('Select All and Deselect All buttons work correctly [US-IE008]', async ({
      extensionContext,
      extensionPage,
      extensionId,
    }) => {
      await seedRules(extensionContext, [
        makeRule('Select All Test', 'selectall.com', { id: 'r3', groupingEnabled: true, groupNameSource: 'label' }),
      ]);

      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesExportWizard(extensionPage);

      await wizard.deselectAll();
      await wizard.expectSelectedCount(0);
      await wizard.expectExportButtonDisabled();

      await wizard.selectAll();
      await wizard.expectSelectedCount(1);
      await wizard.expectExportButtonEnabled();
    });

    test('Export button is disabled when no rules are selected [US-IE008]', async ({
      extensionContext,
      extensionPage,
      extensionId,
    }) => {
      await seedRules(extensionContext, [
        makeRule('No Select Test', 'noselect.com', { id: 'r4', groupingEnabled: true, groupNameSource: 'label' }),
      ]);

      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesExportWizard(extensionPage);
      await wizard.deselectAll();
      await wizard.expectExportButtonDisabled();
    });

    test('Export button is disabled on the Import/Export page when there are no rules [US-IE008]', async ({
      extensionPage,
      extensionId,
    }) => {
      await goToImportExportSection(extensionPage, extensionId);

      const exportBtn = extensionPage
        .getByTestId('page-import-export-card-export-rules')
        .getByRole('button', { name: /^export$/i });
      await expect(exportBtn).toBeDisabled();
    });
  });

  // ── US-IE009: Export to file or clipboard ───────────────────────────────

  test.describe('Export Output [US-IE009]', () => {
    test('Export wizard shows selected rule count and Export button [US-IE009]', async ({
      extensionContext,
      extensionPage,
      extensionId,
    }) => {
      await seedRules(extensionContext, [
        makeRule('Export Ready Rule', 'exportready.com', { id: 'r5', groupingEnabled: true, groupNameSource: 'label' }),
      ]);

      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesExportWizard(extensionPage);

      await wizard.expectAllRulesSelected(1);
      await wizard.expectExportButtonEnabled();
    });

    test('Export step has a split button with Export and chevron/dropdown [US-IE009]', async ({
      extensionContext,
      extensionPage,
      extensionId,
    }) => {
      await seedRules(extensionContext, [
        makeRule('Split Button Rule', 'splitbtn.com', { id: 'r6', groupingEnabled: true, groupNameSource: 'label' }),
      ]);

      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesExportWizard(extensionPage);

      await expect(wizard.exportFileButton()).toBeVisible();
      await expect(wizard.exportOptionsButton()).toBeVisible();
    });

    test('Copy to Clipboard option is available in the export dropdown [US-IE009]', async ({
      extensionContext,
      extensionPage,
      extensionId,
    }) => {
      await seedRules(extensionContext, [
        makeRule('Clipboard Rule', 'clipboard.com', { id: 'r7', groupingEnabled: true, groupNameSource: 'label' }),
      ]);

      await goToImportExportSection(extensionPage, extensionId);
      const wizard = await openRulesExportWizard(extensionPage);

      await wizard.exportOptionsButton().click();
      await expect(wizard.exportClipboardButton()).toBeVisible();
    });
  });

  // ── Wizard triggers (context-based, no URL routing for import/export) ──────

  test.describe('Wizard triggers', () => {
    /**
     * Open the wizard from one entry point, then assert (a) the dialog is
     * visible, (b) the hash didn't change, (c) Escape closes the dialog
     * and leaves the same hash.
     */
    async function expectWizardOpenAndHashStable(
      page: Page,
      extensionId: string,
      hash: string,
      openWizard: () => Promise<void>,
    ): Promise<void> {
      await page.goto(`chrome-extension://${extensionId}/options.html${hash}`);
      await page.waitForLoadState('domcontentloaded');

      await openWizard();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
      await expect.poll(() => page.evaluate(() => window.location.hash)).toBe(hash);

      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toBeHidden();
      await expect.poll(() => page.evaluate(() => window.location.hash)).toBe(hash);
    }

    test('opens the rules import wizard from the #importexport cards page and stays on that hash', async ({
      extensionPage,
      extensionId,
    }) => {
      await expectWizardOpenAndHashStable(extensionPage, extensionId, '#importexport', async () => {
        await extensionPage
          .getByTestId('page-import-export-card-import-rules')
          .getByRole('button')
          .click();
      });
      await expect(extensionPage.getByTestId('page-import-export')).toBeVisible();
    });

    test('rules empty-state Import button opens the wizard and leaves the hash on #rules', async ({
      extensionPage,
      extensionId,
    }) => {
      await expectWizardOpenAndHashStable(extensionPage, extensionId, '#rules', async () => {
        const emptyState = extensionPage.getByTestId('page-rules-empty');
        await emptyState.waitFor({ state: 'visible', timeout: 10_000 });
        await emptyState.getByRole('button', { name: /import/i }).click();
      });
    });

    test('sessions empty-state Import button opens the wizard and leaves the hash on #sessions', async ({
      extensionContext,
      extensionPage,
      extensionId,
    }) => {
      await clearSessions(extensionContext);

      await expectWizardOpenAndHashStable(extensionPage, extensionId, '#sessions', async () => {
        const emptyState = extensionPage.getByTestId('page-sessions-empty');
        await emptyState.waitFor({ state: 'visible', timeout: 10_000 });
        await emptyState.getByRole('button', { name: /import/i }).click();
      });
    });

    test('home onboarding "Import pack" button opens the wizard and leaves the hash on #home', async ({
      extensionPage,
      extensionId,
    }) => {
      // No rules seeded -> hero is shown.
      await expectWizardOpenAndHashStable(extensionPage, extensionId, '#home', async () => {
        const heroImport = extensionPage.getByTestId('home-hero-import');
        await heroImport.waitFor({ state: 'visible', timeout: 10_000 });
        await heroImport.click();
      });
    });

    test('refresh on #importexport does not re-open any wizard', async ({
      extensionPage,
      extensionId,
    }) => {
      await extensionPage.goto(`chrome-extension://${extensionId}/options.html#importexport`);
      await extensionPage.waitForLoadState('domcontentloaded');
      await expect(extensionPage.getByTestId('page-import-export')).toBeVisible();
      await expect(extensionPage.getByRole('dialog')).toBeHidden();

      await extensionPage.reload();
      await extensionPage.waitForLoadState('domcontentloaded');
      await expect(extensionPage.getByTestId('page-import-export')).toBeVisible();
      await expect(extensionPage.getByRole('dialog')).toBeHidden();
    });
  });

  // ── Popup -> rules deeplink (the one allowed cross-page deep link) ─────────

  test.describe('Popup -> rules deeplink', () => {
    test('navigating to #rules?action=import opens the import wizard on the rules page', async ({
      extensionPage,
      extensionId,
    }) => {
      await extensionPage.goto(`chrome-extension://${extensionId}/options.html#rules?action=import`);
      await extensionPage.waitForLoadState('domcontentloaded');

      await expect(extensionPage.getByTestId('page-rules')).toBeVisible({ timeout: 10_000 });
      await expect(extensionPage.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

      await extensionPage.keyboard.press('Escape');
      await expect(extensionPage.getByRole('dialog')).toBeHidden();
      await expect(extensionPage.getByTestId('page-rules')).toBeVisible();
    });
  });
});
