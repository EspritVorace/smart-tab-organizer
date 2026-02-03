import { z } from 'zod';
import { getMessage } from '../utils/i18n';
import { idSchema, createRegexValidator, createDomainFilterValidator } from './common.js';
import { 
  groupNameSourceOptions, 
  deduplicationMatchModeOptions,
  colorOptions,
  type GroupNameSourceValue, 
  type DeduplicationMatchModeValue,
  type ColorValue 
} from './enums.js';

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
  color: z.enum(colorOptions.map(opt => opt.value) as [ColorValue, ...ColorValue[]]),
  deduplicationEnabled: z.boolean().default(true),
  presetId: z.string().nullable()
}).refine((data) => {
  // Si presetId est null, les validations conditionnelles s'appliquent
  if (data.presetId === null) {
    // titleParsingRegEx obligatoire si groupNameSource = 'title'
    if (data.groupNameSource === 'title' && (!data.titleParsingRegEx || data.titleParsingRegEx.trim() === '')) {
      return false;
    }
    // urlParsingRegEx obligatoire si groupNameSource = 'url'
    if (data.groupNameSource === 'url' && (!data.urlParsingRegEx || data.urlParsingRegEx.trim() === '')) {
      return false;
    }
  }
  return true;
}, () => ({
  message: getMessage('errorZodRequired'),
  path: ['titleParsingRegEx']
})).refine((data) => {
  // Validation conditionnelle pour urlParsingRegEx quand presetId est null
  if (data.presetId === null && data.groupNameSource === 'url' && (!data.urlParsingRegEx || data.urlParsingRegEx.trim() === '')) {
    return false;
  }
  return true;
}, () => ({
  message: getMessage('errorZodRequired'),
  path: ['urlParsingRegEx']
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