import { z } from 'zod';
import { idSchema } from './common.js';
import { getMessage } from '@/utils/i18n';

const chromeGroupColorSchema = z.enum([
  'grey', 'blue', 'red', 'yellow', 'green',
  'pink', 'purple', 'cyan', 'orange',
]);

const savedTabSchema = z.object({
  id: idSchema,
  title: z.string(),
  url: z.string().min(1),
  favIconUrl: z.string().optional(),
});

const savedTabGroupSchema = z.object({
  id: idSchema,
  title: z.string(),
  color: chromeGroupColorSchema,
  tabs: z.array(savedTabSchema),
  collapsed: z.boolean().optional(),
});

export const sessionSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  groups: z.array(savedTabGroupSchema),
  ungroupedTabs: z.array(savedTabSchema),
  isPinned: z.boolean(),
  isArchived: z.boolean().optional(),
  categoryId: z.string().optional().nullable(),
  note: z.string().optional(),
  position: z.number().optional(),
  // ISO 8601 timestamp of the last time this session was restored. Distinct
  // from updatedAt (last edit): a restore does not modify the session content.
  lastRestoredAt: z.string().optional(),
});

export const sessionsArraySchema = z.array(sessionSchema);

export type SessionForUniqueness = { id: string; name: string };

// Schema with name-uniqueness validation for a single session.
export const createSessionSchemaWithUniqueness = (existingSessions: SessionForUniqueness[], editingSessionId?: string) => {
  return sessionSchema.refine((data) => {
    const existingNames = existingSessions
      .filter(s => editingSessionId ? s.id !== editingSessionId : true)
      .map(s => s.name.toLowerCase());
    return !existingNames.includes(data.name.toLowerCase());
  }, {
    error: () => getMessage('errorSessionNameUnique'),
    path: ['name'],
  });
};
