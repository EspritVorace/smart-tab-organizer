/**
 * Barrel for Page Objects shared between `tests/e2e/` and
 * `e2e-doc-scenarios/`. See `README.md` for the naming convention and the
 * template used to create a new Page Object.
 */
export { DialogPage } from './DialogPage.js';
export { PopupPage } from './PopupPage.js';
export {
  ImportWizardPage,
  type ImportClassificationCounts,
  type ImportConflictMode,
} from './ImportWizardPage.js';
export { ExportWizardPageBase } from './ExportWizardPageBase.js';
export { ExportWizardPage } from './ExportWizardPage.js';
export { SessionsExportWizardPage } from './SessionsExportWizardPage.js';
export {
  RuleWizardPage,
  type RuleWizardConfigMode,
  type RuleWizardGroupNameSource,
} from './RuleWizardPage.js';
export { SnapshotWizardPage } from './SnapshotWizardPage.js';
export {
  RestoreWizardPage,
  type RestoreTargetMode,
  type DuplicateTabAction,
  type GroupConflictAction,
} from './RestoreWizardPage.js';
export { SessionsListPage } from './SessionsListPage.js';
export { WorkspaceListPage } from './WorkspaceListPage.js';
export { SessionEditorPage } from './SessionEditorPage.js';
export { DomainRulesListPage } from './DomainRulesListPage.js';
export {
  OptionsEditModalPage,
  type DeduplicationMatchMode,
} from './OptionsEditModalPage.js';
