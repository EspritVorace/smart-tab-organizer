import { defineWorkspaceItems, DEFAULT_WORKSPACE_ID } from './workspaceStorage.js';

/**
 * All settings/sessions/statistics items are scoped per workspace under
 * `local:ws:{wsId}:{field}`. For Lots 1-2 (before the active-workspace runtime
 * is wired through), every consumer keeps reading via the items below, which
 * are bound to the default workspace. Lot 2 introduces a context that re-binds
 * these items to the actually active workspace.
 */
const _defaultItems = defineWorkspaceItems(DEFAULT_WORKSPACE_ID);

export const globalGroupingEnabledItem = _defaultItems.globalGroupingEnabledItem;
export const globalDeduplicationEnabledItem = _defaultItems.globalDeduplicationEnabledItem;
export const deduplicateUnmatchedDomainsItem = _defaultItems.deduplicateUnmatchedDomainsItem;
export const deduplicationKeepStrategyItem = _defaultItems.deduplicationKeepStrategyItem;
export const domainRulesItem = _defaultItems.domainRulesItem;
export const notifyOnGroupingItem = _defaultItems.notifyOnGroupingItem;
export const notifyOnDeduplicationItem = _defaultItems.notifyOnDeduplicationItem;
export const notifyOnOrganizeItem = _defaultItems.notifyOnOrganizeItem;
export const statisticsItem = _defaultItems.statisticsItem;
export const sessionsItem = _defaultItems.sessionsItem;
export const popupPinnedEmptyCollapsedItem = _defaultItems.popupPinnedEmptyCollapsedItem;

// Map des items settings par champ (pour watchSettingsField)
export const settingsItemMap = {
  globalGroupingEnabled: globalGroupingEnabledItem,
  globalDeduplicationEnabled: globalDeduplicationEnabledItem,
  deduplicateUnmatchedDomains: deduplicateUnmatchedDomainsItem,
  deduplicationKeepStrategy: deduplicationKeepStrategyItem,
  domainRules: domainRulesItem,
  notifyOnGrouping: notifyOnGroupingItem,
  notifyOnDeduplication: notifyOnDeduplicationItem,
  notifyOnOrganize: notifyOnOrganizeItem,
} as const;
