import { z } from 'zod';
import {
  groupNameSourceOptions,
  deduplicationMatchModeOptions,
  colorOptions,
  deduplicationKeepStrategyOptions,
  type GroupNameSourceValue,
  type DeduplicationMatchModeValue,
  type ColorValue,
  type DeduplicationKeepStrategyValue
} from './enums.js';
import { sessionSchema } from './session.js';
import { ruleCategorySchema } from './category.js';
import { workspaceAccentColors } from './workspace.js';

// Relaxed schema for import validation — no conditional refinements for regex fields,
// since those are form-level validations. We just validate structure and types.
export const importDomainRuleSchema = z.object({
  id: z.string().min(1),
  domainFilter: z.string().min(1),
  label: z.string().min(1).max(100),
  fallbackLabel: z.string().max(100).optional(),
  titleParsingRegEx: z.string(),
  urlParsingRegEx: z.string(),
  groupNameSource: z.enum(
    groupNameSourceOptions.map(opt => opt.value) as [GroupNameSourceValue, ...GroupNameSourceValue[]]
  ),
  deduplicationMatchMode: z.enum(
    deduplicationMatchModeOptions.map(opt => opt.value) as [DeduplicationMatchModeValue, ...DeduplicationMatchModeValue[]]
  ),
  color: z.enum(
    colorOptions.map(opt => opt.value) as [ColorValue, ...ColorValue[]]
  ).optional(),
  categoryId: z.string().optional().nullable(),
  deduplicationEnabled: z.boolean().default(true),
  ignoredQueryParams: z.array(z.string()).max(50).default([]),
  presetId: z.string().nullable(),
  urlExtractionMode: z.enum(['regex', 'query_param']).default('regex'),
  urlQueryParamName: z.string().max(64).optional(),
  enabled: z.boolean(),
  badge: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type ImportDomainRule = z.infer<typeof importDomainRuleSchema>;

export const importDataSchema = z.object({
  note: z.string().optional(),
  domainRules: z.array(importDomainRuleSchema)
});

export type ImportData = z.infer<typeof importDataSchema>;

export const importSessionsDataSchema = z.object({
  note: z.string().optional(),
  sessions: z.array(sessionSchema),
});

export type ImportSessionsData = z.infer<typeof importSessionsDataSchema>;

const importWorkspaceMetaSchema = z.object({
  name: z.string().min(1).max(40),
  accentColor: z.enum(workspaceAccentColors),
});

const importWorkspaceSettingsSchema = z.object({
  globalGroupingEnabled: z.boolean(),
  globalDeduplicationEnabled: z.boolean(),
  deduplicateUnmatchedDomains: z.boolean(),
  deduplicationKeepStrategy: z.enum(
    deduplicationKeepStrategyOptions.map(opt => opt.value) as [DeduplicationKeepStrategyValue, ...DeduplicationKeepStrategyValue[]],
  ),
  notifyOnGrouping: z.boolean(),
  notifyOnDeduplication: z.boolean(),
  notifyOnOrganize: z.boolean().optional(),
});

const importWorkspaceStatisticsSchema = z.object({
  tabGroupsCreatedCount: z.number().nonnegative(),
  tabsDeduplicatedCount: z.number().nonnegative(),
  dailyBuckets: z.record(
    z.string(),
    z.record(
      z.string(),
      z.object({ grouping: z.number().nonnegative(), dedup: z.number().nonnegative() }),
    ),
  ).default({}),
  firstUsedAt: z.string().optional(),
});

export const importWorkspaceDataSchema = z.object({
  note: z.string().optional(),
  workspace: importWorkspaceMetaSchema,
  settings: importWorkspaceSettingsSchema,
  domainRules: z.array(importDomainRuleSchema),
  categories: z.array(ruleCategorySchema),
  sessions: z.array(sessionSchema),
  statistics: importWorkspaceStatisticsSchema.optional(),
});

export type ImportWorkspaceData = z.infer<typeof importWorkspaceDataSchema>;
