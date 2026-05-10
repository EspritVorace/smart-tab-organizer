import { z } from 'zod';

/**
 * Radix Themes accent colors allowed for a workspace.
 * Subset of Radix colors, excluding the neutrals (gray/mauve/slate/sage/olive/sand)
 * and bronze/gold/brown which render poorly as a UI accent.
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
