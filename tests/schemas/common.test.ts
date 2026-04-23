import { describe, it, expect, vi } from 'vitest';
import { createRegexValidator, createDomainFilterValidator, idSchema } from '../../src/schemas/common';

vi.mock('../../src/utils/i18n.js', () => ({
  getMessage: vi.fn((key: string) => key),
}));

describe('idSchema', () => {
  it('accepts a non-empty string', () => {
    expect(idSchema.safeParse('abc-123').success).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(idSchema.safeParse('').success).toBe(false);
  });
});

describe('createRegexValidator', () => {
  const validator = createRegexValidator();
  const validatorAllowEmpty = createRegexValidator(true);

  it('accepts a valid regex with capture group', () => {
    expect(validator.safeParse('Issue #(\\d+)').success).toBe(true);
  });

  it('accepts a regex with multiple capture groups', () => {
    expect(validator.safeParse('(foo)-(bar)').success).toBe(true);
  });

  it('rejects a regex without capture group', () => {
    expect(validator.safeParse('\\d+').success).toBe(false);
  });

  it('rejects an invalid regex', () => {
    expect(validator.safeParse('(unclosed').success).toBe(false);
  });

  it('rejects empty string when allowEmpty is false (default)', () => {
    expect(validator.safeParse('').success).toBe(false);
  });

  it('accepts empty string when allowEmpty is true', () => {
    expect(validatorAllowEmpty.safeParse('').success).toBe(true);
  });

  it('still validates non-empty strings when allowEmpty is true', () => {
    expect(validatorAllowEmpty.safeParse('(valid)').success).toBe(true);
    expect(validatorAllowEmpty.safeParse('\\d+').success).toBe(false);
  });
});

describe('createDomainFilterValidator', () => {
  const validator = createDomainFilterValidator();

  it('accepts a typical domain', () => {
    expect(validator.safeParse('example.com').success).toBe(true);
  });

  it('accepts a subdomain', () => {
    expect(validator.safeParse('api.example.com').success).toBe(true);
  });

  it('accepts localhost', () => {
    expect(validator.safeParse('localhost').success).toBe(true);
  });

  it('accepts a regex domain (with special chars)', () => {
    expect(validator.safeParse('github\\.com').success).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(validator.safeParse('').success).toBe(false);
  });

  it('rejects a domain ending with a dot', () => {
    expect(validator.safeParse('example.com.').success).toBe(false);
  });

  it('rejects a bare hostname without TLD', () => {
    expect(validator.safeParse('example').success).toBe(false);
  });

  it('rejects a wildcard domain (*.domain no longer accepted)', () => {
    expect(validator.safeParse('*.example.com').success).toBe(false);
  });

  it('rejects an invalid regex string', () => {
    expect(validator.safeParse('[invalid').success).toBe(false);
  });
});
