/**
 * Composed flows (domain actions) shared between `tests/e2e/` and
 * `e2e-doc-scenarios/`. Consumes Page Objects from `../pages/`.
 *
 * Each action narrates a single business outcome ("import rules from
 * JSON text", "create a snapshot with these tabs", "export sessions to a
 * file") and hides the wizard step plumbing so specs read as business
 * intent rather than a sequence of clicks.
 */
export {
  openRulesImportWizard,
  openRulesExportWizard,
  importRulesViaText,
  importRulesViaFile,
  exportRulesToFile,
  exportRulesToClipboard,
  stubShowSaveFilePicker,
  type ExportRulesOptions,
} from './rules-import-export.js';

export {
  openRuleWizard,
  openEditRuleWizard,
  createRuleViaWizard,
  editRule,
  type RuleWizardCreateConfig,
  type RuleWizardEditPatch,
} from './rules-management.js';

export {
  openSnapshotWizard,
  createSnapshotWithTabs,
  pinSession,
  type CreateSnapshotOptions,
} from './sessions-snapshot.js';

export {
  openCustomizeRestoreWizard,
  restoreSessionAsReplace,
  restoreSessionAsMerge,
  type RestoreReplaceOptions,
  type RestoreMergeOptions,
} from './sessions-restore.js';

export {
  openSessionsExportWizard,
  exportSessionsToFile,
  exportSessionsToClipboard,
  type ExportSessionsOptions,
} from './sessions-export.js';

export {
  openPopup,
  triggerOrganizeFromPopup,
} from './popup-actions.js';

export {
  openChildTabViaMiddleClick,
  openChildTabViaContextMenu,
  waitForGroupCreated,
  waitForGroupingSettled,
  type GroupingHelpers,
  type TabGroupInfo,
} from './tabs-grouping.js';

export {
  expectTabDeduplicated,
  undoLastDeduplication,
  type DeduplicationHelpers,
} from './tabs-deduplication.js';

export {
  getServiceWorker,
  getServiceWorkerWithUndoFn,
  getServiceWorkerWithOrganizeFn,
  getNotificationIds,
  getSmartTabNotificationIds,
  clearAllNotifications,
  setNotificationPrefs,
  executeNotificationUndo,
  triggerOrganizeAllTabsViaSW,
} from './notifications.js';

export {
  clearExtensionStorage,
  seedStorage,
  seedDomainRules,
  seedSessions,
} from './storage-seed.js';

export { createLiveTabGroup, type TabGroupColor } from './live-tab-group.js';

export { waitForToast, type ToastVariant, type WaitForToastOptions } from './toast.js';
