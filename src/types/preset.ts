import { z } from 'zod';
import { 
  groupNameSourceOptions, 
  type GroupNameSourceValue 
} from '@/schemas/enums.js';

// Schéma pour un preset individuel.
// titleExample / urlExample sont requis lorsque le regex correspondant est défini,
// pour documenter un cas concret côté regex titre et côté regex URL.
export const presetSchema = z.object({
  id: z.string(),
  name: z.string(),
  domainFilters: z.array(z.string()),
  titleRegex: z.string().optional(),
  urlRegex: z.string().optional(),
  groupNameSource: z.enum(groupNameSourceOptions.map(opt => opt.value) as [GroupNameSourceValue, ...GroupNameSourceValue[]]),
  titleExample: z.string().optional(),
  urlExample: z.string().optional(),
  description: z.string(),
  urlExtractionMode: z.enum(['regex', 'query_param']).optional(),
  urlQueryParamName: z.string().max(64).regex(/^[A-Za-z0-9_\-.]+$/).optional()
})
  .refine(
    (p) => !p.titleRegex || !!p.titleExample,
    { message: 'titleExample is required when titleRegex is defined', path: ['titleExample'] }
  )
  .refine(
    (p) => (!p.urlRegex && !p.urlQueryParamName) || !!p.urlExample,
    { message: 'urlExample is required when urlRegex or urlQueryParamName is defined', path: ['urlExample'] }
  )
  .refine(
    (p) => p.urlExtractionMode !== 'query_param' || !!p.urlQueryParamName,
    { message: 'urlQueryParamName is required when urlExtractionMode is query_param', path: ['urlQueryParamName'] }
  );

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