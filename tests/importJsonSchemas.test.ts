import { describe, it, expect } from 'vitest';
import { rulesImportJsonSchema, sessionsImportJsonSchema } from '../src/utils/importJsonSchemas';

describe('importJsonSchemas', () => {
  it('derives a draft-7 object schema for rules import', () => {
    expect(rulesImportJsonSchema).toMatchObject({
      type: 'object',
      properties: { domainRules: { type: 'array' } },
    });
    // `note` carries no default and is optional, `domainRules` is required.
    expect(rulesImportJsonSchema.required).toContain('domainRules');
    expect(rulesImportJsonSchema.required).not.toContain('note');
  });

  it('keeps rule fields with a Zod default out of `required` (io: input)', () => {
    const ruleSchema = (rulesImportJsonSchema.properties?.domainRules as { items?: { required?: string[] } })?.items;
    // `deduplicationEnabled` and `ignoredQueryParams` have defaults: optional on input.
    expect(ruleSchema?.required).not.toContain('deduplicationEnabled');
    expect(ruleSchema?.required).not.toContain('ignoredQueryParams');
    // `domainFilter` has no default: still required.
    expect(ruleSchema?.required).toContain('domainFilter');
  });

  it('derives a draft-7 object schema for sessions import', () => {
    expect(sessionsImportJsonSchema).toMatchObject({
      type: 'object',
      properties: { sessions: { type: 'array' } },
    });
    expect(sessionsImportJsonSchema.required).toContain('sessions');
  });
});
