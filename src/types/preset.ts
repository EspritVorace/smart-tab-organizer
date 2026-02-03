import { z } from 'zod';
import { 
  groupNameSourceOptions, 
  type GroupNameSourceValue 
} from '../schemas/enums.js';

// Schéma pour un preset individuel
export const presetSchema = z.object({
  id: z.string(),
  name: z.string(),
  domainFilters: z.array(z.string()),
  titleRegex: z.string().optional(),
  urlRegex: z.string().optional(),
  groupNameSource: z.enum(groupNameSourceOptions.map(opt => opt.value) as [GroupNameSourceValue, ...GroupNameSourceValue[]]),
  example: z.string(),
  description: z.string()
});

// Schéma pour une catégorie de presets
export const presetCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  presets: z.array(presetSchema)
});

// Schéma pour le fichier presets.json complet
export const presetsFileSchema = z.object({
  categories: z.array(presetCategorySchema)
});

// Types inférés
export type Preset = z.infer<typeof presetSchema>;
export type PresetCategory = z.infer<typeof presetCategorySchema>;
export type PresetsFile = z.infer<typeof presetsFileSchema>;