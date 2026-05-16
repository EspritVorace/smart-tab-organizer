/**
 * Composed domain actions for the sessions Export wizard.
 *
 * Each action narrates a single business outcome ("export the selected
 * sessions to a JSON file", "... to the clipboard") and hides the wizard
 * plumbing. Consumes `SessionsExportWizardPage`; never reaches into raw
 * locators.
 *
 * Mirrors the rules-flavoured `exportRulesToFile` / `exportRulesToClipboard`
 * helpers in `rules-import-export.ts`. Both surfaces inherit the same
 * footer split-button from `ExportWizardPageBase`.
 *
 * Callers are expected to have already navigated to the Import/Export
 * section (or any surface that exposes the export-sessions card) before
 * invoking these helpers.
 *
 * Relevant US: US-IE012 (sessions export envelope), US-IE013 (pinned vs
 * normal sub-groups).
 */
import { expect, type Page } from '@playwright/test';
import { SessionsExportWizardPage } from '../pages/SessionsExportWizardPage.js';

export interface ExportSessionsOptions {
  /** Optional free-form note persisted at the top of the JSON payload. */
  note?: string;
  /**
   * Subset to keep. When omitted the wizard exports everything that was
   * pre-selected on open. Use `pinnedOnly` / `unpinnedOnly` for the
   * common group-level toggles, or pass `sessions` to toggle individual
   * sessions by name.
   */
  pinnedOnly?: boolean;
  unpinnedOnly?: boolean;
  sessions?: string[];
}

/**
 * Open the sessions export wizard from the Import/Export cards page.
 *
 * Relevant US: US-IE012 (entry point).
 */
export async function openSessionsExportWizard(
  page: Page,
): Promise<SessionsExportWizardPage> {
  await page
    .getByTestId('page-import-export-card-export-sessions')
    .getByRole('button', { name: /^export$/i })
    .click();
  const wizard = new SessionsExportWizardPage(page);
  await wizard.expectVisible({ timeout: 5000 });
  return wizard;
}

/**
 * Stub `window.showSaveFilePicker` so the Chrome native Save As dialog
 * does not block the export flow under Playwright. The stub returns an
 * in-memory writer whose contents are exposed via the returned `getJson`
 * function (useful for asserting the payload shape).
 *
 * Idempotent: re-installs the stub on every call so tests do not need to
 * track installation state. Duplicated from `rules-import-export.ts`'s
 * private helper because each action module owns its own browser-side
 * scaffolding (avoids a leaky cross-module dependency).
 */
async function stubShowSaveFilePicker(page: Page): Promise<() => Promise<string>> {
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
 * Apply the selection options to an open `SessionsExportWizardPage`. The
 * wizard pre-selects every session on open, so the helpers below only need
 * to toggle the buckets the caller wants to exclude.
 */
async function applySelectionOptions(
  wizard: SessionsExportWizardPage,
  opts: ExportSessionsOptions,
): Promise<void> {
  if (opts.pinnedOnly) {
    await wizard.toggleNormalGroup();
  }
  if (opts.unpinnedOnly) {
    await wizard.togglePinnedGroup();
  }
  if (opts.sessions) {
    await wizard.deselectAll();
    for (const name of opts.sessions) {
      await wizard.toggleSession(name);
    }
  }
}

/**
 * End-to-end "export the selected sessions to a JSON file" flow.
 *
 * Steps: open wizard, optionally fill the note, toggle the requested
 * selection buckets, stub the OS save picker, click the primary Export
 * button, wait for the dialog to close. The caller can use the returned
 * `getJson()` to inspect the written payload.
 *
 * Relevant US: US-IE012 (export to file + dialog closes on success).
 */
export async function exportSessionsToFile(
  page: Page,
  opts: ExportSessionsOptions = {},
): Promise<{ getJson: () => Promise<string> }> {
  const wizard = await openSessionsExportWizard(page);
  if (opts.note !== undefined) await wizard.fillNote(opts.note);
  await applySelectionOptions(wizard, opts);
  const getJson = await stubShowSaveFilePicker(page);
  await wizard.clickExportToFile();
  await wizard.expectHidden();
  return { getJson };
}

/**
 * End-to-end "export the selected sessions to the clipboard" flow.
 *
 * Steps: open wizard, optionally fill the note, toggle the requested
 * selection buckets, open the split-button popover, click the "Clipboard"
 * entry, wait for the dialog to close.
 *
 * Relevant US: US-IE012 (export to clipboard + dialog closes on success).
 */
export async function exportSessionsToClipboard(
  page: Page,
  opts: ExportSessionsOptions = {},
): Promise<void> {
  const wizard = await openSessionsExportWizard(page);
  if (opts.note !== undefined) await wizard.fillNote(opts.note);
  await applySelectionOptions(wizard, opts);
  await wizard.clickExportToClipboard();
  await expect(wizard.dialog()).toBeHidden();
}
