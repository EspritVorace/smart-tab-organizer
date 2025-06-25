import { z } from 'zod';
import { idSchema, createRegexValidator } from './common.js';

// Schéma pour regexPresets (sans "enabled")
export const regexPresetSchema = z.object({
  id: idSchema,
  name: z.string()
    .min(1)
    .max(100),
  regex: createRegexValidator(false),
  urlRegex: createRegexValidator(true)
});

// Type inféré
export type RegexPreset = z.infer<typeof regexPresetSchema>;

// Schéma pour les tableaux
export const regexPresetsSchema = z.array(regexPresetSchema);
export type RegexPresets = z.infer<typeof regexPresetsSchema>;