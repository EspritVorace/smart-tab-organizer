import { z } from 'zod';
import { getMessage } from '@/utils/i18n';
import { idSchema, createRegexValidator, createDomainFilterValidator } from './common.js';
import {
  groupNameSourceOptions,
  deduplicationMatchModeOptions,
  colorOptions,
  urlExtractionModeOptions,
  type GroupNameSourceValue,
  type DeduplicationMatchModeValue,
  type ColorValue,
  type UrlExtractionModeValue
} from './enums.js';

// Allowed pattern for ignored query param names (HTTP syntax plus the wildcard `*`).
const ignoredQueryParamPattern = /^[A-Za-z0-9_\-.*]+$/;

// Stricter pattern for the query param name used for extraction (no wildcard).
const queryParamNamePattern = /^[A-Za-z0-9_\-.]+$/;

// groupNameSource modes that imply extraction from the URL.
const URL_SOURCE_MODES: GroupNameSourceValue[] = ['url', 'smart', 'smart_label', 'smart_preset', 'smart_manual'];

// Schema for domainRules (without the "enabled" flag).
export const domainRuleSchema = z.object({
  id: idSchema,
  domainFilter: createDomainFilterValidator(),
  label: z.string()
    .min(1)
    .max(100),
  titleParsingRegEx: createRegexValidator(true),
  urlParsingRegEx: createRegexValidator(true),
  groupNameSource: z.enum(groupNameSourceOptions.map(opt => opt.value) as [GroupNameSourceValue, ...GroupNameSourceValue[]]),
  deduplicationMatchMode: z.enum(deduplicationMatchModeOptions.map(opt => opt.value) as [DeduplicationMatchModeValue, ...DeduplicationMatchModeValue[]]),
  color: z.enum(colorOptions.map(opt => opt.value) as [ColorValue, ...ColorValue[]]).optional(),
  categoryId: z.string().optional().nullable(),
  deduplicationEnabled: z.boolean().default(true),
  ignoredQueryParams: z.array(
    z.string().min(1).max(64).regex(ignoredQueryParamPattern, {
      message: getMessage('errorInvalidParamName'),
    }),
  ).max(50).default([]),
  presetId: z.string().nullable(),
  urlExtractionMode: z.enum(
    urlExtractionModeOptions.map(opt => opt.value) as [UrlExtractionModeValue, ...UrlExtractionModeValue[]]
  ).default('regex'),
  urlQueryParamName: z.string().max(64).refine(
    (val) => val === '' || queryParamNamePattern.test(val),
    { error: () => getMessage('errorInvalidQueryParamName') }
  ).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
}).refine((data) => {
  // When presetId is null, the conditional validations below apply.
  if (data.presetId === null) {
    // titleParsingRegEx is required when groupNameSource === 'title'.
    if (data.groupNameSource === 'title' && (!data.titleParsingRegEx || data.titleParsingRegEx.trim() === '')) {
      return false;
    }
    // urlParsingRegEx is required when groupNameSource === 'url' AND extraction uses regex.
    if (
      data.groupNameSource === 'url'
      && data.urlExtractionMode !== 'query_param'
      && (!data.urlParsingRegEx || data.urlParsingRegEx.trim() === '')
    ) {
      return false;
    }
  }
  return true;
}, {
  error: () => getMessage('errorZodRequired'),
  path: ['titleParsingRegEx']
}).refine((data) => {
  // urlParsingRegEx is required only when extraction uses regex.
  return !(
    data.presetId === null
    && data.groupNameSource === 'url'
    && data.urlExtractionMode !== 'query_param'
    && (!data.urlParsingRegEx || data.urlParsingRegEx.trim() === '')
  );
}, {
  error: () => getMessage('errorZodRequired'),
  path: ['urlParsingRegEx']
}).refine((data) => {
  // urlQueryParamName is required when mode === 'query_param' and a URL-based source is used.
  if (data.presetId !== null) return true;
  if (data.urlExtractionMode !== 'query_param') return true;
  if (!URL_SOURCE_MODES.includes(data.groupNameSource)) return true;
  return !!data.urlQueryParamName && data.urlQueryParamName.trim() !== '';
}, {
  error: () => getMessage('errorQueryParamNameRequired'),
  path: ['urlQueryParamName']
}).refine((data) => {
  // In `exact_ignore_params` mode at least one parameter must be declared,
  // otherwise the mode is equivalent to `exact` and the distinction is misleading.
  if (data.deduplicationEnabled && data.deduplicationMatchMode === 'exact_ignore_params') {
    return Array.isArray(data.ignoredQueryParams) && data.ignoredQueryParams.length > 0;
  }
  return true;
}, {
  error: () => getMessage('errorIgnoredParamsRequired'),
  path: ['ignoredQueryParams']
});

export type DomainRule = z.infer<typeof domainRuleSchema>;

// Schema with label-uniqueness validation for a single domain rule.
export const createDomainRuleSchemaWithUniqueness = (existingRules: DomainRule[], editingRuleId?: string) => {
  return domainRuleSchema.refine((data) => {
    const existingLabels = existingRules
      .filter(rule => editingRuleId ? rule.id !== editingRuleId : true)
      .map(rule => rule.label.toLowerCase());
    
    return !existingLabels.includes(data.label.toLowerCase());
  }, {
    error: () => getMessage('errorLabelUnique'),
    path: ['label']
  });
};

// Array schema that validates label uniqueness across all domain rules.
export const domainRulesSchema = z.array(domainRuleSchema).refine((rules) => {
  const labels = rules.map(rule => rule.label.toLowerCase());
  const uniqueLabels = new Set(labels);
  return labels.length === uniqueLabels.size;
}, {
  error: () => getMessage('errorLabelUnique'),
  path: ['label']
});

export type DomainRules = z.infer<typeof domainRulesSchema>;