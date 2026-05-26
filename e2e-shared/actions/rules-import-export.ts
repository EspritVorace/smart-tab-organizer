/**
 * Composed domain actions for the rules Import/Export wizards.
 *
 * Each action narrates a single business outcome ("import these rules from
 * JSON text", "export the current rules to a file") and hides the wizard
 * step plumbing. Composes the Page Objects from `../pages/`; never
 * reaches into raw locators.
 *
 * Shared between `tests/e2e/` (functional suite, US-IE001..US-IE009) and
 * `e2e-doc-scenarios/` (narrative captures that walk through the same
 * flows for screenshots / docs).
 */
import { expect, type Page } from '@playwright/test';
import { ImportWizardPage } from '../pages/ImportWizardPage.js';
import { ExportWizardPage } from '../pages/ExportWizardPage.js';

/**
 * Open the rules import wizard from the Import/Export cards page.
 * Returns the `ImportWizardPage` instance so callers can interact with
 * the open dialog without re-instantiating it.
 *
 * Locale-agnostic: targets the card's only button via role rather than its
 * (localized) accessible name, so the helper works in every UI language.
 *
 * Relevant US: US-IE001 (wizard entry point).
 */
export async function openRulesImportWizard(page: Page): Promise<ImportWizardPage> {
  await page
    .getByTestId('page-import-export-card-import-rules')
    .getByRole('button')
    .first()
    .click();
  const wizard = new ImportWizardPage(page);
  await wizard.expectVisible({ timeout: 5000 });
  return wizard;
}

/**
 * Open the rules export wizard from the Import/Export cards page.
 *
 * Locale-agnostic: targets the card's only button via role rather than its
 * (localized) accessible name.
 *
 * Relevant US: US-IE008 (export entry point).
 */
export async function openRulesExportWizard(page: Page): Promise<ExportWizardPage> {
  await page
    .getByTestId('page-import-export-card-export-rules')
    .getByRole('button')
    .first()
    .click();
  const wizard = new ExportWizardPage(page);
  await wizard.expectVisible({ timeout: 5000 });
  return wizard;
}

/**
 * End-to-end "import these rules from raw JSON text" flow.
 *
 * Steps: open wizard, switch to Text mode, paste JSON, advance to the
 * classification step, confirm, wait for the dialog to close.
 *
 * Relevant US: US-IE001 (source selection), US-IE002 (JSON validation),
 * US-IE007 (confirmation + close).
 */
export async function importRulesViaText(page: Page, json: string): Promise<void> {
  const wizard = await openRulesImportWizard(page);
  await wizard.pasteJson(json);
  await wizard.clickNext();
  await wizard.confirmImport();
  await wizard.expectHidden();
}

/**
 * End-to-end "import these rules from a JSON file" flow (drag-and-drop
 * substitute: drives the hidden `<input type="file">` via Playwright's
 * `setInputFiles`, which exercises the same handler as Browse / drop).
 *
 * `file` accepts a filesystem path, a `Buffer` payload (`{ name, mimeType,
 * buffer }`) or any value Playwright's `Locator.setInputFiles` understands.
 *
 * Relevant US: US-IE001 (source selection / File mode), US-IE007.
 */
export async function importRulesViaFile(
  page: Page,
  file: Parameters<ReturnType<Page['locator']>['setInputFiles']>[0],
): Promise<void> {
  const wizard = await openRulesImportWizard(page);
  await wizard.selectFileMode();
  await wizard.dialog().locator('input[type="file"]').setInputFiles(file);
  await wizard.clickNext();
  await wizard.confirmImport();
  await wizard.expectHidden();
}

export interface ExportRulesOptions {
  /** Optional free-form note persisted at the top of the JSON payload. */
  note?: string;
}

/**
 * Stub `window.showSaveFilePicker` so the Chrome native Save As dialog
 * does not block the export flow under Playwright. The stub returns an
 * in-memory writer whose contents are exposed via the returned `getJson`
 * function (useful for asserting the payload shape).
 *
 * Idempotent: re-installs the stub on every call so tests do not need to
 * track installation state. Exported so the narrative capture pipeline can
 * reuse the exact same stub when it wants to drive the export flow without
 * also asserting on the written payload (typical "capture only" usage).
 */
export async function stubShowSaveFilePicker(page: Page): Promise<() => Promise<string>> {
  await page.evaluate(() => {
    const w = window as unknown as {
      __exportedJson?: string;
      showSaveFilePicker: (opts: unknown) => Promise<{
        createWritable: () => Promise<{
          write: (data: string) => Promise<void>;
          close: () => Promise<void>;
        }>;
      }>;
    };
    w.__exportedJson = '';
    w.showSaveFilePicker = async () => ({
      createWritable: async () => ({
        write: async (data: string) => {
          w.__exportedJson = data;
        },
        close: async () => undefined,
      }),
    });
  });
  return async () => {
    return (await page.evaluate(
      () => (window as unknown as { __exportedJson?: string }).__exportedJson ?? '',
    )) as string;
  };
}

/**
 * End-to-end "export the selected rules to a JSON file" flow.
 *
 * Steps: open wizard, optionally fill the note, stub the OS save picker,
 * click the primary Export button, wait for the dialog to close. The
 * caller can use the returned `getJson()` to inspect the written payload.
 *
 * Relevant US: US-IE009 (export to file + dialog closes on success).
 */
export async function exportRulesToFile(
  page: Page,
  opts: ExportRulesOptions = {},
): Promise<{ getJson: () => Promise<string> }> {
  const wizard = await openRulesExportWizard(page);
  if (opts.note !== undefined) await wizard.fillNote(opts.note);
  const getJson = await stubShowSaveFilePicker(page);
  await wizard.clickExportToFile();
  await wizard.expectHidden();
  return { getJson };
}

/**
 * End-to-end "export the selected rules to the clipboard" flow.
 *
 * Steps: open wizard, optionally fill the note, click the dedicated
 * "Clipboard" footer button, wait for the dialog to close.
 *
 * The clipboard write itself is performed by `navigator.clipboard.writeText`,
 * which Playwright stubs transparently when the test is granted the
 * `clipboard-write` permission (configured in `playwright.config.ts`).
 *
 * Relevant US: US-IE009 (export to clipboard + dialog closes on success).
 */
export async function exportRulesToClipboard(
  page: Page,
  opts: ExportRulesOptions = {},
): Promise<void> {
  const wizard = await openRulesExportWizard(page);
  if (opts.note !== undefined) await wizard.fillNote(opts.note);
  await wizard.clickExportToClipboard();
  await expect(wizard.dialog()).toBeHidden();
}
