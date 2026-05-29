import { z } from 'zod';
import {
  importDataSchema,
  importSessionsDataSchema,
  importWorkspaceDataSchema,
} from '@/schemas/importExport';
import { getMessage } from '@/utils/i18n';

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
  if (node) node.description = getMessage(messageKey);
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
  return schema;
}

export const rulesImportJsonSchema: ImportJsonSchema = buildRulesSchema();
export const sessionsImportJsonSchema: ImportJsonSchema = buildSessionsSchema();
export const workspaceImportJsonSchema: ImportJsonSchema = buildWorkspaceSchema();
