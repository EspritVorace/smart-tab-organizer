import { z } from 'zod';
import { idSchema } from './common.js';

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
});

export const sessionSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  groups: z.array(savedTabGroupSchema),
  ungroupedTabs: z.array(savedTabSchema),
  isPinned: z.boolean(),
});

export const sessionsArraySchema = z.array(sessionSchema);
