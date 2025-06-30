import { z } from 'zod';
import { idSchema, createRegexValidator } from './common.js';

// Schéma pour regexPresets (sans "enabled")
export const regexPresetSchema = z.object({
  id: idSchema,
  name: z.string()
    .min(1)
    .max(100),
  titleParsingRegEx: createRegexValidator(false),
  urlParsingRegEx: createRegexValidator(true)
});

// Type inféré
export type RegexPreset = z.infer<typeof regexPresetSchema>;

// Schéma pour les tableaux
export const regexPresetsSchema = z.array(regexPresetSchema);
export type RegexPresets = z.infer<typeof regexPresetsSchema>;

// Fonction pour créer un schéma avec validation d'unicité
export const createRegexPresetSchemaWithUniqueness = (
  existingPresets: RegexPreset[],
  excludeId?: string
) => {
  return regexPresetSchema.refine(
    (preset) => {
      // Vérifier l'unicité du nom
      const nameExists = existingPresets.some(
        (existing) => 
          existing.id !== excludeId && 
          existing.name.toLowerCase() === preset.name.toLowerCase()
      );
      return !nameExists;
    },
    {
      message: 'A regex preset with this name already exists',
      path: ['name']
    }
  );
};