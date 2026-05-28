import { z } from 'zod';
import {
  importDataSchema,
  importSessionsDataSchema,
  importWorkspaceDataSchema,
} from '@/schemas/importExport';

/**
 * JSON Schema objects fed to the import editor for autocompletion and linting.
 * Derived from the runtime Zod schemas so there is a single source of truth.
 *
 * - `io: 'input'` keeps fields that carry a Zod `.default()` optional, matching
 *   what a user actually has to type (the default is filled at parse time).
 * - `target: 'draft-7'` matches the draft expected by codemirror-json-schema's
 *   validator (json-schema-library Draft07).
 */
export type ImportJsonSchema = z.core.JSONSchema.BaseSchema;

export const rulesImportJsonSchema: ImportJsonSchema = z.toJSONSchema(importDataSchema, {
  target: 'draft-7',
  io: 'input',
});

export const sessionsImportJsonSchema: ImportJsonSchema = z.toJSONSchema(importSessionsDataSchema, {
  target: 'draft-7',
  io: 'input',
});

export const workspaceImportJsonSchema: ImportJsonSchema = z.toJSONSchema(importWorkspaceDataSchema, {
  target: 'draft-7',
  io: 'input',
});
