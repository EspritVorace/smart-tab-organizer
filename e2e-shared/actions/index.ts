/**
 * Composed flows (domain actions) shared between `tests/e2e/` and
 * `e2e-doc-scenarios/`. Consumes Page Objects from `../pages/`.
 *
 * Each action narrates a single business outcome ("import rules from
 * JSON text", "export rules to a file") and hides the wizard step
 * plumbing so specs read as business intent rather than a sequence of
 * clicks.
 */
export {
  openRulesImportWizard,
  openRulesExportWizard,
  importRulesViaText,
  importRulesViaFile,
  exportRulesToFile,
  exportRulesToClipboard,
  type ExportRulesOptions,
} from './rules-import-export.js';
