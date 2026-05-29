import { z } from 'zod';
import { 
  groupNameSourceOptions, 
  type GroupNameSourceValue 
} from '@/schemas/enums.js';

// Schema for a single preset.
// titleExample / urlExample are required whenever the corresponding regex is
// defined, so the title regex and URL regex each ship with a concrete example.
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

// Schema for a preset category. Labels and emojis are resolved from the
// unified category source (src/data/categories.json) via categoriesStore.
export const presetCategorySchema = z.object({
  id: z.string().min(1),
  presets: z.array(presetSchema)
});

// Schema for the full presets.json file.
export const presetsFileSchema = z.object({
  categories: z.array(presetCategorySchema)
});

export type Preset = z.infer<typeof presetSchema>;
export type PresetCategory = z.infer<typeof presetCategorySchema>;
export type PresetsFile = z.infer<typeof presetsFileSchema>;