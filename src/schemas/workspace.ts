import { z } from 'zod';

/**
 * Couleurs d'accent Radix Themes autorisées pour un workspace.
 * Subset des couleurs Radix excluant les neutres (gray/mauve/slate/sage/olive/sand)
 * et bronze/gold/brown qui rendent mal en accent UI.
 */
export const workspaceAccentColors = [
  'tomato', 'red', 'ruby', 'crimson', 'pink', 'plum', 'purple', 'violet',
  'iris', 'indigo', 'blue', 'cyan', 'teal', 'jade', 'green', 'grass',
  'orange', 'amber', 'yellow', 'lime',
] as const;

export type WorkspaceAccentColor = (typeof workspaceAccentColors)[number];

export const workspaceMetaSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(40),
  accentColor: z.enum(workspaceAccentColors),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type WorkspaceMeta = z.infer<typeof workspaceMetaSchema>;

export const workspacesIndexSchema = z.array(workspaceMetaSchema).min(1);
