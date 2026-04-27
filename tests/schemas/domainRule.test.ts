import { describe, it, expect, vi } from 'vitest';
import {
  domainRuleSchema,
  createDomainRuleSchemaWithUniqueness,
  domainRulesSchema,
  type DomainRule,
} from '../../src/schemas/domainRule';

vi.mock('../../src/utils/i18n.js', () => ({
  getMessage: vi.fn((key: string) => key),
}));

const validRule: DomainRule = {
  id: 'rule-1',
  domainFilter: 'github.com',
  label: 'GitHub',
  titleParsingRegEx: '',
  urlParsingRegEx: '',
  groupNameSource: 'smart',
  deduplicationMatchMode: 'exact',
  color: 'blue',
  categoryId: null,
  deduplicationEnabled: true,
  ignoredQueryParams: [],
  presetId: 'preset-github',
};

describe('domainRuleSchema', () => {
  it('accepts a valid rule with a preset', () => {
    expect(domainRuleSchema.safeParse(validRule).success).toBe(true);
  });

  it('fills default values for deduplicationEnabled and ignoredQueryParams', () => {
    const partial = { ...validRule };
    // @ts-expect-error testing runtime defaults
    delete partial.deduplicationEnabled;
    // @ts-expect-error testing runtime defaults
    delete partial.ignoredQueryParams;
    const result = domainRuleSchema.safeParse(partial);
    expect(result.success).toBe(true);
    expect((result as { success: true; data: DomainRule }).data.deduplicationEnabled).toBe(true);
    expect((result as { success: true; data: DomainRule }).data.ignoredQueryParams).toEqual([]);
  });

  it('rejects a rule with an empty label', () => {
    const result = domainRuleSchema.safeParse({ ...validRule, label: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a rule with an invalid domain filter', () => {
    const result = domainRuleSchema.safeParse({ ...validRule, domainFilter: 'not-a-domain' });
    expect(result.success).toBe(false);
  });

  describe('conditional refinement: titleParsingRegEx required when groupNameSource=title and presetId=null', () => {
    it('rejects when titleParsingRegEx is empty and source is title', () => {
      const rule = { ...validRule, presetId: null, groupNameSource: 'title' as const, titleParsingRegEx: '' };
      expect(domainRuleSchema.safeParse(rule).success).toBe(false);
    });

    it('accepts when titleParsingRegEx is provided and source is title', () => {
      const rule = {
        ...validRule,
        presetId: null,
        groupNameSource: 'title' as const,
        titleParsingRegEx: 'Issue #(\\d+)',
      };
      expect(domainRuleSchema.safeParse(rule).success).toBe(true);
    });
  });

  describe('conditional refinement: urlParsingRegEx required when groupNameSource=url and presetId=null', () => {
    it('rejects when urlParsingRegEx is empty and source is url', () => {
      const rule = { ...validRule, presetId: null, groupNameSource: 'url' as const, urlParsingRegEx: '' };
      expect(domainRuleSchema.safeParse(rule).success).toBe(false);
    });

    it('accepts when urlParsingRegEx is provided and source is url', () => {
      const rule = {
        ...validRule,
        presetId: null,
        groupNameSource: 'url' as const,
        urlParsingRegEx: 'issues/(\\d+)',
      };
      expect(domainRuleSchema.safeParse(rule).success).toBe(true);
    });
  });

  describe('conditional refinement: exact_ignore_params requires at least one param', () => {
    it('rejects when deduplicationMatchMode=exact_ignore_params and ignoredQueryParams is empty', () => {
      const rule = {
        ...validRule,
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact_ignore_params' as const,
        ignoredQueryParams: [],
      };
      expect(domainRuleSchema.safeParse(rule).success).toBe(false);
    });

    it('accepts when exact_ignore_params and at least one param provided', () => {
      const rule = {
        ...validRule,
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact_ignore_params' as const,
        ignoredQueryParams: ['utm_source'],
      };
      expect(domainRuleSchema.safeParse(rule).success).toBe(true);
    });

    it('accepts exact_ignore_params when deduplication is disabled (no params needed)', () => {
      const rule = {
        ...validRule,
        deduplicationEnabled: false,
        deduplicationMatchMode: 'exact_ignore_params' as const,
        ignoredQueryParams: [],
      };
      expect(domainRuleSchema.safeParse(rule).success).toBe(true);
    });
  });
});

describe('createDomainRuleSchemaWithUniqueness', () => {
  it('accepts a rule with a unique label', () => {
    const existing = [{ ...validRule, id: 'other', label: 'GitLab' }];
    const schema = createDomainRuleSchemaWithUniqueness(existing);
    expect(schema.safeParse(validRule).success).toBe(true);
  });

  it('rejects a rule with a duplicate label', () => {
    const existing = [{ ...validRule, id: 'other', label: 'GitHub' }];
    const schema = createDomainRuleSchemaWithUniqueness(existing);
    const result = schema.safeParse(validRule);
    expect(result.success).toBe(false);
    const labelError = result.error?.issues.find(i => i.path.includes('label'));
    expect(labelError).toBeDefined();
  });

  it('allows keeping the same label when editing the same rule (by id)', () => {
    const existing = [validRule];
    const schema = createDomainRuleSchemaWithUniqueness(existing, validRule.id);
    expect(schema.safeParse(validRule).success).toBe(true);
  });

  it('is case-insensitive for label uniqueness', () => {
    const existing = [{ ...validRule, id: 'other', label: 'github' }];
    const schema = createDomainRuleSchemaWithUniqueness(existing);
    const result = schema.safeParse({ ...validRule, label: 'GITHUB' });
    expect(result.success).toBe(false);
  });
});

describe('domainRulesSchema', () => {
  it('accepts an empty array', () => {
    expect(domainRulesSchema.safeParse([]).success).toBe(true);
  });

  it('accepts an array of rules with unique labels', () => {
    const rules = [
      validRule,
      { ...validRule, id: 'rule-2', label: 'GitLab', domainFilter: 'gitlab.com' },
    ];
    expect(domainRulesSchema.safeParse(rules).success).toBe(true);
  });

  it('rejects an array with duplicate labels', () => {
    const rules = [
      validRule,
      { ...validRule, id: 'rule-2', label: 'GitHub', domainFilter: 'github.io' },
    ];
    const result = domainRulesSchema.safeParse(rules);
    expect(result.success).toBe(false);
  });
});
