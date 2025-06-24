import { z } from 'zod';
import { getMessage } from '../utils/i18n.js';
import { idSchema, createRegexValidator } from './common.js';
import { 
  groupNameSourceOptions, 
  deduplicationMatchModeOptions,
  type GroupNameSourceValue, 
  type DeduplicationMatchModeValue 
} from './enums.js';

// Schéma pour domainRules (sans "enabled")
export const domainRuleSchema = z.object({
  id: idSchema,
  domainFilter: z.string().min(1),
  label: z.string()
    .min(1)
    .max(100),
  titleParsingRegEx: createRegexValidator(true),
  urlParsingRegEx: createRegexValidator(true),
  groupNameSource: z.enum(groupNameSourceOptions.map(opt => opt.value) as [GroupNameSourceValue, ...GroupNameSourceValue[]]),
  deduplicationMatchMode: z.enum(deduplicationMatchModeOptions.map(opt => opt.value) as [DeduplicationMatchModeValue, ...DeduplicationMatchModeValue[]]),
  groupId: z.string().nullable(),
  collapseNew: z.boolean().default(false),
  collapseExisting: z.boolean().default(false),
  deduplicationEnabled: z.boolean().default(true)
}).refine((data) => {
  // titleParsingRegEx obligatoire si groupNameSource = 'title'
  if (data.groupNameSource === 'title' && (!data.titleParsingRegEx || data.titleParsingRegEx.trim() === '')) {
    return false;
  }
  // urlParsingRegEx obligatoire si groupNameSource = 'url'
  if (data.groupNameSource === 'url' && (!data.urlParsingRegEx || data.urlParsingRegEx.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: getMessage('errorZodRequired'),
  path: ['titleParsingRegEx']
}).refine((data) => {
  // Validation conditionnelle pour urlParsingRegEx
  if (data.groupNameSource === 'url' && (!data.urlParsingRegEx || data.urlParsingRegEx.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: getMessage('errorZodRequired'),
  path: ['urlParsingRegEx']
});

// Type inféré
export type DomainRule = z.infer<typeof domainRuleSchema>;

// Schéma pour les tableaux
export const domainRulesSchema = z.array(domainRuleSchema);
export type DomainRules = z.infer<typeof domainRulesSchema>;