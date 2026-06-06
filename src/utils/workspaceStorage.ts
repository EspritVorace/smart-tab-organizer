import { storage, type WxtStorageItem, type StorageItemKey } from 'wxt/utils/storage';
import type { DomainRuleSettings } from '@/types/syncSettings.js';
import { defaultAppSettings } from '@/types/syncSettings.js';
import type { DeduplicationKeepStrategyValue, DefaultRestoreActionValue } from '@/schemas/enums.js';
import type { Statistics } from '@/types/statistics.js';
import { defaultStatistics } from '@/types/statistics.js';
import type { Session } from '@/types/session.js';
import type { WorkspaceMeta } from '@/schemas/workspace.js';
import { type RuleViewState, DEFAULT_RULE_VIEW_STATE } from '@/utils/ruleViewUtils.js';

export const DEFAULT_WORKSPACE_ID = 'default';

/**
 * List of fields scoped per workspace, exposed for migration and tests.
 * Each entry represents a key that lived at the root of `storage.local`
 * before workspaces were introduced and is now prefixed with
 * `local:ws:{wsId}:`.
 *
 * `categories` is intentionally absent: rule categories are read-only
 * constants loaded in memory from `src/data/categories.json` (see
 * `categoriesStore.ts`) and are never persisted in storage.
 */
export const WORKSPACE_SCOPED_KEYS = [
  'globalGroupingEnabled',
  'globalDeduplicationEnabled',
  'deduplicateUnmatchedDomains',
  'deduplicationKeepStrategy',
  'defaultRestoreAction',
  'domainRules',
  'notifyOnGrouping',
  'notifyOnDeduplication',
  'notifyOnOrganize',
  'statistics',
  'sessions',
  'pinnedSessions',
  'archivedSessions',
  'popupPinnedEmptyCollapsed',
  'rulesViewState',
] as const;

export type WorkspaceScopedKey = (typeof WORKSPACE_SCOPED_KEYS)[number];

/**
 * Storage key for a workspace-scoped field.
 *
 * The default workspace keeps the legacy unprefixed keys (`local:domainRules`,
 * `local:statistics`, etc.) so existing data, tests, and rollback paths
 * continue to work unchanged. Additional workspaces use the namespaced form
 * `local:ws:{wsId}:{field}`.
 */
export function workspaceStorageKey(wsId: string, field: WorkspaceScopedKey): StorageItemKey {
  return wsId === DEFAULT_WORKSPACE_ID
    ? (`local:${field}` as StorageItemKey)
    : (`local:ws:${wsId}:${field}` as StorageItemKey);
}

export interface ScopedItems {
  globalGroupingEnabledItem: WxtStorageItem<boolean, Record<string, unknown>>;
  globalDeduplicationEnabledItem: WxtStorageItem<boolean, Record<string, unknown>>;
  deduplicateUnmatchedDomainsItem: WxtStorageItem<boolean, Record<string, unknown>>;
  deduplicationKeepStrategyItem: WxtStorageItem<DeduplicationKeepStrategyValue, Record<string, unknown>>;
  defaultRestoreActionItem: WxtStorageItem<DefaultRestoreActionValue, Record<string, unknown>>;
  domainRulesItem: WxtStorageItem<DomainRuleSettings, Record<string, unknown>>;
  notifyOnGroupingItem: WxtStorageItem<boolean, Record<string, unknown>>;
  notifyOnDeduplicationItem: WxtStorageItem<boolean, Record<string, unknown>>;
  notifyOnOrganizeItem: WxtStorageItem<boolean, Record<string, unknown>>;
  statisticsItem: WxtStorageItem<Statistics, Record<string, unknown>>;
  sessionsItem: WxtStorageItem<Session[], Record<string, unknown>>;
  pinnedSessionsItem: WxtStorageItem<Session[], Record<string, unknown>>;
  archivedSessionsItem: WxtStorageItem<Session[], Record<string, unknown>>;
  popupPinnedEmptyCollapsedItem: WxtStorageItem<boolean, Record<string, unknown>>;
  rulesViewStateItem: WxtStorageItem<RuleViewState, Record<string, unknown>>;
}

const scopedItemsCache = new Map<string, ScopedItems>();

/**
 * Returns memoized WXT storage items scoped to a given workspace ID.
 * Each item targets `local:ws:{wsId}:{field}`, mirroring the legacy
 * `local:{field}` keys but namespaced.
 */
export function defineWorkspaceItems(wsId: string): ScopedItems {
  const cached = scopedItemsCache.get(wsId);
  if (cached) return cached;

  const items: ScopedItems = {
    globalGroupingEnabledItem: storage.defineItem<boolean>(
      workspaceStorageKey(wsId, 'globalGroupingEnabled'),
      { defaultValue: defaultAppSettings.globalGroupingEnabled },
    ),
    globalDeduplicationEnabledItem: storage.defineItem<boolean>(
      workspaceStorageKey(wsId, 'globalDeduplicationEnabled'),
      { defaultValue: defaultAppSettings.globalDeduplicationEnabled },
    ),
    deduplicateUnmatchedDomainsItem: storage.defineItem<boolean>(
      workspaceStorageKey(wsId, 'deduplicateUnmatchedDomains'),
      { defaultValue: defaultAppSettings.deduplicateUnmatchedDomains },
    ),
    deduplicationKeepStrategyItem: storage.defineItem<DeduplicationKeepStrategyValue>(
      workspaceStorageKey(wsId, 'deduplicationKeepStrategy'),
      { defaultValue: defaultAppSettings.deduplicationKeepStrategy },
    ),
    defaultRestoreActionItem: storage.defineItem<DefaultRestoreActionValue>(
      workspaceStorageKey(wsId, 'defaultRestoreAction'),
      { defaultValue: defaultAppSettings.defaultRestoreAction },
    ),
    domainRulesItem: storage.defineItem<DomainRuleSettings>(
      workspaceStorageKey(wsId, 'domainRules'),
      { defaultValue: defaultAppSettings.domainRules },
    ),
    notifyOnGroupingItem: storage.defineItem<boolean>(
      workspaceStorageKey(wsId, 'notifyOnGrouping'),
      { defaultValue: defaultAppSettings.notifyOnGrouping },
    ),
    notifyOnDeduplicationItem: storage.defineItem<boolean>(
      workspaceStorageKey(wsId, 'notifyOnDeduplication'),
      { defaultValue: defaultAppSettings.notifyOnDeduplication },
    ),
    notifyOnOrganizeItem: storage.defineItem<boolean>(
      workspaceStorageKey(wsId, 'notifyOnOrganize'),
      { defaultValue: defaultAppSettings.notifyOnOrganize },
    ),
    statisticsItem: storage.defineItem<Statistics>(
      workspaceStorageKey(wsId, 'statistics'),
      { defaultValue: defaultStatistics },
    ),
    sessionsItem: storage.defineItem<Session[]>(
      workspaceStorageKey(wsId, 'sessions'),
      { defaultValue: [] },
    ),
    pinnedSessionsItem: storage.defineItem<Session[]>(
      workspaceStorageKey(wsId, 'pinnedSessions'),
      { defaultValue: [] },
    ),
    archivedSessionsItem: storage.defineItem<Session[]>(
      workspaceStorageKey(wsId, 'archivedSessions'),
      { defaultValue: [] },
    ),
    popupPinnedEmptyCollapsedItem: storage.defineItem<boolean>(
      workspaceStorageKey(wsId, 'popupPinnedEmptyCollapsed'),
      { defaultValue: false },
    ),
    rulesViewStateItem: storage.defineItem<RuleViewState>(
      workspaceStorageKey(wsId, 'rulesViewState'),
      { defaultValue: DEFAULT_RULE_VIEW_STATE },
    ),
  };

  scopedItemsCache.set(wsId, items);
  return items;
}

/**
 * Top-level index of all workspaces. Validated against `workspacesIndexSchema`
 * by consumers. Defaults to an empty array; the migration ensures at least the
 * default workspace exists.
 */
export const workspacesIndexItem = storage.defineItem<WorkspaceMeta[]>(
  'local:workspaces',
  { defaultValue: [] },
);

/**
 * ID of the currently active workspace. Defaults to `DEFAULT_WORKSPACE_ID`
 * for fresh installs; migration sets it explicitly for upgrades.
 */
export const activeWorkspaceIdItem = storage.defineItem<string>(
  'local:activeWorkspaceId',
  { defaultValue: DEFAULT_WORKSPACE_ID },
);

/** Test-only helper to clear the scoped-items memo. */
export function _resetWorkspaceItemsCacheForTests(): void {
  scopedItemsCache.clear();
}
