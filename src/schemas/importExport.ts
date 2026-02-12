import { z } from 'zod';
import {
  groupNameSourceOptions,
  deduplicationMatchModeOptions,
  colorOptions,
  type GroupNameSourceValue,
  type DeduplicationMatchModeValue,
  type ColorValue
} from './enums.js';

// Relaxed schema for import validation — no conditional refinements for regex fields,
// since those are form-level validations. We just validate structure and types.
export const importDomainRuleSchema = z.object({
  id: z.string().min(1),
  domainFilter: z.string().min(1),
  label: z.string().min(1).max(100),
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
  ),
  deduplicationEnabled: z.boolean().default(true),
  presetId: z.string().nullable(),
  enabled: z.boolean(),
  badge: z.string().optional()
});

export type ImportDomainRule = z.infer<typeof importDomainRuleSchema>;

export const importDataSchema = z.object({
  domainRules: z.array(importDomainRuleSchema)
});

export type ImportData = z.infer<typeof importDataSchema>;
