import { z } from 'zod';

export const chromeGroupColorSchema = z.enum([
  'grey', 'blue', 'red', 'yellow', 'green',
  'pink', 'purple', 'cyan', 'orange',
]);

export const ruleCategorySchema = z
  .object({
    id: z.string().min(1),
    emoji: z.string().min(1),
    color: chromeGroupColorSchema,
    labelKey: z.string().optional(),
    label: z.string().optional(),
    builtIn: z.boolean().default(false),
  })
  .refine(v => Boolean(v.labelKey) || Boolean(v.label), {
    message: 'Category must have either labelKey (built-in) or label (custom)',
  });

export const categoriesFileSchema = z.object({
  categories: z.array(ruleCategorySchema),
});

export type RuleCategory = z.infer<typeof ruleCategorySchema>;
export type CategoriesFile = z.infer<typeof categoriesFileSchema>;
