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

// Regex autorisée pour les noms de query params (syntaxe HTTP + wildcard `*`).
const ignoredQueryParamPattern = /^[A-Za-z0-9_\-.*]+$/;

// Pattern strict pour le nom d'un query param utilisé en extraction (sans wildcard).
const queryParamNamePattern = /^[A-Za-z0-9_\-.]+$/;

// groupNameSource modes qui impliquent une extraction depuis l'URL
const URL_SOURCE_MODES: GroupNameSourceValue[] = ['url', 'smart', 'smart_label', 'smart_preset', 'smart_manual'];

// Schéma pour domainRules (sans "enabled")
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
  urlQueryParamName: z.string().max(64).regex(queryParamNamePattern, {
    message: getMessage('errorInvalidQueryParamName'),
  }).optional()
}).refine((data) => {
  // Si presetId est null, les validations conditionnelles s'appliquent
  if (data.presetId === null) {
    // titleParsingRegEx obligatoire si groupNameSource = 'title'
    if (data.groupNameSource === 'title' && (!data.titleParsingRegEx || data.titleParsingRegEx.trim() === '')) {
      return false;
    }
    // urlParsingRegEx obligatoire si groupNameSource = 'url' ET extraction par regex
    if (
      data.groupNameSource === 'url'
      && data.urlExtractionMode !== 'query_param'
      && (!data.urlParsingRegEx || data.urlParsingRegEx.trim() === '')
    ) {
      return false;
    }
  }
  return true;
}, () => ({
  message: getMessage('errorZodRequired'),
  path: ['titleParsingRegEx']
})).refine((data) => {
  // urlParsingRegEx requis seulement quand l'extraction se fait par regex
  if (
    data.presetId === null
    && data.groupNameSource === 'url'
    && data.urlExtractionMode !== 'query_param'
    && (!data.urlParsingRegEx || data.urlParsingRegEx.trim() === '')
  ) {
    return false;
  }
  return true;
}, () => ({
  message: getMessage('errorZodRequired'),
  path: ['urlParsingRegEx']
})).refine((data) => {
  // urlQueryParamName requis quand mode = query_param et source URL impliquée
  if (data.presetId !== null) return true;
  if (data.urlExtractionMode !== 'query_param') return true;
  if (!URL_SOURCE_MODES.includes(data.groupNameSource)) return true;
  return !!data.urlQueryParamName && data.urlQueryParamName.trim() !== '';
}, () => ({
  message: getMessage('errorQueryParamNameRequired'),
  path: ['urlQueryParamName']
})).refine((data) => {
  // En mode `exact_ignore_params`, au moins un paramètre doit être déclaré,
  // sinon le mode est équivalent à `exact` et on évite la confusion.
  if (data.deduplicationEnabled && data.deduplicationMatchMode === 'exact_ignore_params') {
    return Array.isArray(data.ignoredQueryParams) && data.ignoredQueryParams.length > 0;
  }
  return true;
}, () => ({
  message: getMessage('errorIgnoredParamsRequired'),
  path: ['ignoredQueryParams']
}));

// Type inféré
export type DomainRule = z.infer<typeof domainRuleSchema>;

// Schéma avec validation d'unicité du label pour un domainRule individuel
export const createDomainRuleSchemaWithUniqueness = (existingRules: DomainRule[], editingRuleId?: string) => {
  return domainRuleSchema.refine((data) => {
    const existingLabels = existingRules
      .filter(rule => editingRuleId ? rule.id !== editingRuleId : true)
      .map(rule => rule.label.toLowerCase());
    
    return !existingLabels.includes(data.label.toLowerCase());
  }, () => ({
    message: getMessage('errorLabelUnique'),
    path: ['label']
  }));
};

// Schéma pour les tableaux avec validation d'unicité des labels
export const domainRulesSchema = z.array(domainRuleSchema).refine((rules) => {
  const labels = rules.map(rule => rule.label.toLowerCase());
  const uniqueLabels = new Set(labels);
  return labels.length === uniqueLabels.size;
}, () => ({
  message: getMessage('errorLabelUnique'),
  path: ['label']
}));

export type DomainRules = z.infer<typeof domainRulesSchema>;