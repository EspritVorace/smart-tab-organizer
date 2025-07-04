import { z } from 'zod';
import { idSchema } from './common.js';
import { colorOptions, type ColorValue } from './enums.js';

// Schéma pour logicalGroups (sans "enabled")
export const logicalGroupSchema = z.object({
  id: idSchema,
  label: z.string()
    .min(1)
    .max(100),
  color: z.enum(colorOptions.map(opt => opt.value) as [ColorValue, ...ColorValue[]])
});

// Type inféré
export type LogicalGroup = z.infer<typeof logicalGroupSchema>;

// Schéma pour les tableaux
export const logicalGroupsSchema = z.array(logicalGroupSchema);
export type LogicalGroups = z.infer<typeof logicalGroupsSchema>;

// Fonction pour créer un schéma avec validation d'unicité
export const createLogicalGroupSchemaWithUniqueness = (
  existingGroups: LogicalGroup[],
  excludeId?: string
) => {
  return logicalGroupSchema.refine(
    (group) => {
      // Vérifier l'unicité du nom
      const nameExists = existingGroups.some(
        (existing) => 
          existing.id !== excludeId && 
          existing.label.toLowerCase() === group.label.toLowerCase()
      );
      return !nameExists;
    },
    {
      message: 'A logical group with this name already exists',
      path: ['label']
    }
  );
};