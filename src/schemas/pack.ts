import { z } from 'zod';
import { importDomainRuleSchema } from './importExport.js';

export const localizedStringSchema = z.union([
  z.string().min(1),
  z
    .record(z.string(), z.string())
    .refine(
      (m) => Object.keys(m).length > 0,
      'localizedString must contain at least one entry',
    ),
]);

export const packParamOptionSchema = z.object({
  value: z.string().min(1),
  label: localizedStringSchema,
});

export const packParamSchema = z
  .object({
    id: z.string().min(1),
    label: localizedStringSchema,
    default: z.string().min(1),
    options: z.array(packParamOptionSchema).min(1),
  })
  .refine(
    (param) => param.options.some((opt) => opt.value === param.default),
    {
      message: 'pack param default must reference a value listed in options',
      path: ['default'],
    },
  );

export const packConfigurableSchema = z.object({
  rulePattern: z.string().min(1),
  params: z.array(packParamSchema).min(1),
});

export const packCategorySchema = z.object({
  id: z.string().min(1),
  label: localizedStringSchema,
  icon: z.string().optional(),
});

export const packCategoriesFileSchema = z.object({
  categories: z.array(packCategorySchema),
});

export const packManifestSchema = z
  .object({
    id: z.string().min(1),
    name: localizedStringSchema,
    description: localizedStringSchema.optional(),
    categoryId: z.string().min(1).optional(),
    category: localizedStringSchema.optional(),
    configurable: packConfigurableSchema.optional(),
  })
  .refine(
    (manifest) => Boolean(manifest.categoryId) !== Boolean(manifest.category),
    {
      message: 'pack must declare exactly one of categoryId or category',
      path: ['categoryId'],
    },
  );

export const packFileSchema = z.object({
  version: z.literal(1),
  pack: packManifestSchema,
  domainRules: z.array(importDomainRuleSchema),
});

export type LocalizedString = z.infer<typeof localizedStringSchema>;
export type PackParamOption = z.infer<typeof packParamOptionSchema>;
export type PackParam = z.infer<typeof packParamSchema>;
export type PackConfigurable = z.infer<typeof packConfigurableSchema>;
export type PackCategory = z.infer<typeof packCategorySchema>;
export type PackCategoriesFile = z.infer<typeof packCategoriesFileSchema>;
export type PackManifest = z.infer<typeof packManifestSchema>;
export type PackFile = z.infer<typeof packFileSchema>;
