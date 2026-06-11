import { z } from 'zod';
import {
  importDataSchema,
  importSessionsDataSchema,
  importWorkspaceDataSchema,
} from '@/schemas/importExport';
import { getMessage, type MessageKey } from '@/utils/i18n';

/**
 * JSON Schema objects fed to the import editor for autocompletion, linting and
 * hover/completion documentation. Derived from the runtime Zod schemas so there
 * is a single source of truth.
 *
 * - `io: 'input'` keeps fields that carry a Zod `.default()` optional, matching
 *   what a user actually has to type (the default is filled at parse time).
 * - `target: 'draft-7'` matches the draft expected by codemirror-json-schema's
 *   validator (json-schema-library Draft07).
 *
 * Field documentation is injected here (rather than via Zod `.describe()`) to
 * keep the runtime validation schemas free of UI text and to localize the
 * descriptions through `getMessage` at the editor layer.
 */
export type ImportJsonSchema = z.core.JSONSchema.BaseSchema;

interface MutableSchema {
  description?: string;
  properties?: Record<string, MutableSchema | undefined>;
  items?: MutableSchema;
}

function describe(node: MutableSchema | undefined, messageKey: string): void {
  if (node) node.description = getMessage(messageKey as MessageKey);
}

/** Documents every property of a single domain-rule object node. */
function describeDomainRuleItems(items: MutableSchema | undefined): void {
  const p = items?.properties;
  if (!p) return;
  describe(p.id, 'jsonDocRuleId');
  describe(p.domainFilter, 'jsonDocRuleDomainFilter');
  describe(p.label, 'jsonDocRuleLabel');
  describe(p.fallbackLabel, 'jsonDocRuleFallbackLabel');
  describe(p.titleParsingRegEx, 'jsonDocRuleTitleParsingRegEx');
  describe(p.urlParsingRegEx, 'jsonDocRuleUrlParsingRegEx');
  describe(p.groupNameSource, 'jsonDocRuleGroupNameSource');
  describe(p.deduplicationMatchMode, 'jsonDocRuleDeduplicationMatchMode');
  describe(p.color, 'jsonDocRuleColor');
  describe(p.categoryId, 'jsonDocRuleCategoryId');
  describe(p.deduplicationEnabled, 'jsonDocRuleDeduplicationEnabled');
  describe(p.ignoredQueryParams, 'jsonDocRuleIgnoredQueryParams');
  describe(p.presetId, 'jsonDocRulePresetId');
  describe(p.urlExtractionMode, 'jsonDocRuleUrlExtractionMode');
  describe(p.urlQueryParamName, 'jsonDocRuleUrlQueryParamName');
  describe(p.enabled, 'jsonDocRuleEnabled');
  describe(p.badge, 'jsonDocRuleBadge');
  describe(p.createdAt, 'jsonDocRuleCreatedAt');
  describe(p.updatedAt, 'jsonDocRuleUpdatedAt');
}

/** Documents every property of a single saved-tab object node. */
function describeSavedTabItems(items: MutableSchema | undefined): void {
  const p = items?.properties;
  if (!p) return;
  describe(p.id, 'jsonDocTabId');
  describe(p.title, 'jsonDocTabTitle');
  describe(p.url, 'jsonDocTabUrl');
  describe(p.favIconUrl, 'jsonDocTabFavIconUrl');
}

/** Documents a saved-tab-group object node and its nested tabs. */
function describeSavedTabGroupItems(items: MutableSchema | undefined): void {
  const p = items?.properties;
  if (!p) return;
  describe(p.id, 'jsonDocGroupId');
  describe(p.title, 'jsonDocGroupTitle');
  describe(p.color, 'jsonDocGroupColor');
  describe(p.tabs, 'jsonDocGroupTabs');
  describe(p.collapsed, 'jsonDocGroupCollapsed');
  describeSavedTabItems(p.tabs?.items);
}

/** Documents a session object node and its nested groups / ungrouped tabs. */
function describeSessionItems(items: MutableSchema | undefined): void {
  const p = items?.properties;
  if (!p) return;
  describe(p.id, 'jsonDocSessionId');
  describe(p.name, 'jsonDocSessionName');
  describe(p.createdAt, 'jsonDocSessionCreatedAt');
  describe(p.updatedAt, 'jsonDocSessionUpdatedAt');
  describe(p.groups, 'jsonDocSessionGroups');
  describe(p.ungroupedTabs, 'jsonDocSessionUngroupedTabs');
  describe(p.isPinned, 'jsonDocSessionIsPinned');
  describe(p.isArchived, 'jsonDocSessionIsArchived');
  describe(p.categoryId, 'jsonDocSessionCategoryId');
  describe(p.note, 'jsonDocSessionNote');
  describe(p.position, 'jsonDocSessionPosition');
  describeSavedTabGroupItems(p.groups?.items);
  describeSavedTabItems(p.ungroupedTabs?.items);
}

/** Documents the workspace metadata object node. */
function describeWorkspaceMeta(node: MutableSchema | undefined): void {
  const p = node?.properties;
  if (!p) return;
  describe(p.name, 'jsonDocWorkspaceName');
  describe(p.accentColor, 'jsonDocWorkspaceAccentColor');
}

/** Documents the workspace settings object node. */
function describeWorkspaceSettings(node: MutableSchema | undefined): void {
  const p = node?.properties;
  if (!p) return;
  describe(p.globalGroupingEnabled, 'jsonDocSettingsGlobalGroupingEnabled');
  describe(p.globalDeduplicationEnabled, 'jsonDocSettingsGlobalDeduplicationEnabled');
  describe(p.deduplicateUnmatchedDomains, 'jsonDocSettingsDeduplicateUnmatchedDomains');
  describe(p.deduplicationKeepStrategy, 'jsonDocSettingsDeduplicationKeepStrategy');
  describe(p.defaultRestoreAction, 'jsonDocSettingsDefaultRestoreAction');
  describe(p.notifyOnGrouping, 'jsonDocSettingsNotifyOnGrouping');
  describe(p.notifyOnDeduplication, 'jsonDocSettingsNotifyOnDeduplication');
  describe(p.notifyOnOrganize, 'jsonDocSettingsNotifyOnOrganize');
}

/** Documents the workspace statistics object node. */
function describeWorkspaceStatistics(node: MutableSchema | undefined): void {
  const p = node?.properties;
  if (!p) return;
  describe(p.tabGroupsCreatedCount, 'jsonDocStatisticsTabGroupsCreatedCount');
  describe(p.tabsDeduplicatedCount, 'jsonDocStatisticsTabsDeduplicatedCount');
  describe(p.dailyBuckets, 'jsonDocStatisticsDailyBuckets');
  describe(p.firstUsedAt, 'jsonDocStatisticsFirstUsedAt');
}

function buildRulesSchema(): ImportJsonSchema {
  const schema = z.toJSONSchema(importDataSchema, { target: 'draft-7', io: 'input' });
  const p = (schema as MutableSchema).properties;
  describe(p?.note, 'jsonDocNote');
  describe(p?.domainRules, 'jsonDocDomainRules');
  describeDomainRuleItems(p?.domainRules?.items);
  return schema;
}

function buildSessionsSchema(): ImportJsonSchema {
  const schema = z.toJSONSchema(importSessionsDataSchema, { target: 'draft-7', io: 'input' });
  const p = (schema as MutableSchema).properties;
  describe(p?.note, 'jsonDocNote');
  describe(p?.sessions, 'jsonDocSessions');
  describeSessionItems(p?.sessions?.items);
  return schema;
}

function buildWorkspaceSchema(): ImportJsonSchema {
  const schema = z.toJSONSchema(importWorkspaceDataSchema, { target: 'draft-7', io: 'input' });
  const p = (schema as MutableSchema).properties;
  describe(p?.note, 'jsonDocNote');
  describe(p?.workspace, 'jsonDocWorkspace');
  describe(p?.settings, 'jsonDocSettings');
  describe(p?.domainRules, 'jsonDocDomainRules');
  describe(p?.sessions, 'jsonDocSessions');
  describe(p?.statistics, 'jsonDocStatistics');
  describeDomainRuleItems(p?.domainRules?.items);
  describeSessionItems(p?.sessions?.items);
  describeWorkspaceMeta(p?.workspace);
  describeWorkspaceSettings(p?.settings);
  describeWorkspaceStatistics(p?.statistics);
  return schema;
}

export const rulesImportJsonSchema: ImportJsonSchema = buildRulesSchema();
export const sessionsImportJsonSchema: ImportJsonSchema = buildSessionsSchema();
export const workspaceImportJsonSchema: ImportJsonSchema = buildWorkspaceSchema();
