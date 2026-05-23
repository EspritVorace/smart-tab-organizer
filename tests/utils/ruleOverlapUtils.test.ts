import { describe, it, expect } from 'vitest';
import {
  findOverlappingRules,
  getOverlapPrecedenceList,
  rulesOverlap,
} from '../../src/utils/ruleOverlapUtils';
import type { DomainRuleSetting } from '../../src/types/syncSettings';

const makeRule = (
  id: string,
  domainFilter: string,
  enabled = true,
): DomainRuleSetting => ({
  id,
  domainFilter,
  label: `Rule ${id}`,
  titleParsingRegEx: '',
  urlParsingRegEx: '',
  groupNameSource: 'title',
  deduplicationMatchMode: 'exact',
  deduplicationEnabled: true,
  presetId: null,
  enabled,
});

describe('rulesOverlap', () => {
  it('returns true for two identical plain domains', () => {
    const a = makeRule('a', 'google.com');
    const b = makeRule('b', 'google.com');
    expect(rulesOverlap(a, b)).toBe(true);
  });

  it('returns true between a parent domain and its subdomain', () => {
    const parent = makeRule('p', 'google.com');
    const sub = makeRule('s', 'mail.google.com');
    expect(rulesOverlap(parent, sub)).toBe(true);
    expect(rulesOverlap(sub, parent)).toBe(true);
  });

  it('returns false for sibling subdomains under the same root', () => {
    const mail = makeRule('m', 'mail.google.com');
    const drive = makeRule('d', 'drive.google.com');
    expect(rulesOverlap(mail, drive)).toBe(false);
  });

  it('returns false for unrelated plain domains', () => {
    const a = makeRule('a', 'github.com');
    const b = makeRule('b', 'google.com');
    expect(rulesOverlap(a, b)).toBe(false);
  });

  it('returns true between a plain domain and a regex alternation that covers it', () => {
    const plain = makeRule('p', 'google.com');
    const rx = makeRule('r', '(google|github).com');
    expect(rulesOverlap(plain, rx)).toBe(true);
    expect(rulesOverlap(rx, plain)).toBe(true);
  });

  it('returns false between a plain domain and a regex that does not cover it', () => {
    const plain = makeRule('p', 'github.com');
    const rx = makeRule('r', '(google|gitlab).com');
    expect(rulesOverlap(plain, rx)).toBe(false);
  });

  it('returns false between two distinct regex rules (text-equality only)', () => {
    const a = makeRule('a', '(google|alt).com');
    const b = makeRule('b', '(github|alt).com');
    expect(rulesOverlap(a, b)).toBe(false);
  });

  it('returns true between two textually identical regex rules', () => {
    const a = makeRule('a', '(google|alt).com');
    const b = makeRule('b', '(google|alt).com');
    expect(rulesOverlap(a, b)).toBe(true);
  });

  it('returns false when domainFilter is empty', () => {
    const a = makeRule('a', '');
    const b = makeRule('b', 'google.com');
    expect(rulesOverlap(a, b)).toBe(false);
  });

  it('returns false when comparing a rule to itself by id', () => {
    const a = makeRule('a', 'google.com');
    expect(rulesOverlap(a, a)).toBe(false);
  });
});

describe('findOverlappingRules', () => {
  it('returns an empty array when no other rule overlaps', () => {
    const target = makeRule('t', 'github.com');
    const others = [makeRule('a', 'google.com'), makeRule('b', 'gitlab.com')];
    expect(findOverlappingRules(target, [target, ...others])).toEqual([]);
  });

  it('returns overlapping rules in the order of the input array', () => {
    const r1 = makeRule('1', 'mail.google.com');
    const r2 = makeRule('2', 'google.com');
    const r3 = makeRule('3', 'github.com');
    const r4 = makeRule('4', 'google.com');
    const all = [r1, r2, r3, r4];
    const result = findOverlappingRules(r1, all);
    expect(result.map((r) => r.id)).toEqual(['2', '4']);
  });

  it('excludes the current rule from the result', () => {
    const a = makeRule('a', 'google.com');
    const b = makeRule('b', 'google.com');
    const result = findOverlappingRules(a, [a, b]);
    expect(result.map((r) => r.id)).toEqual(['b']);
  });

  it('ignores disabled candidates', () => {
    const target = makeRule('t', 'google.com');
    const disabledOverlap = makeRule('d', 'mail.google.com', false);
    const enabledOverlap = makeRule('e', 'google.com');
    const result = findOverlappingRules(target, [target, disabledOverlap, enabledOverlap]);
    expect(result.map((r) => r.id)).toEqual(['e']);
  });

  it('returns an empty array when the rule itself is disabled', () => {
    const target = makeRule('t', 'google.com', false);
    const other = makeRule('o', 'google.com');
    expect(findOverlappingRules(target, [target, other])).toEqual([]);
  });
});

describe('getOverlapPrecedenceList', () => {
  it('returns an empty array when no overlap exists', () => {
    const a = makeRule('a', 'github.com');
    const b = makeRule('b', 'google.com');
    expect(getOverlapPrecedenceList(a, [a, b])).toEqual([]);
  });

  it('includes the current rule along with overlapping ones, in array order', () => {
    const r1 = makeRule('1', 'google.com');
    const r2 = makeRule('2', 'github.com');
    const r3 = makeRule('3', 'mail.google.com');
    const r4 = makeRule('4', 'google.com');
    const result = getOverlapPrecedenceList(r3, [r1, r2, r3, r4]);
    expect(result.map((r) => r.id)).toEqual(['1', '3', '4']);
  });

  it('excludes disabled rules from the precedence list', () => {
    const r1 = makeRule('1', 'google.com');
    const r2 = makeRule('2', 'google.com', false);
    const r3 = makeRule('3', 'google.com');
    const result = getOverlapPrecedenceList(r1, [r1, r2, r3]);
    expect(result.map((r) => r.id)).toEqual(['1', '3']);
  });

  it('returns an empty array when the current rule is disabled', () => {
    const r1 = makeRule('1', 'google.com', false);
    const r2 = makeRule('2', 'google.com');
    expect(getOverlapPrecedenceList(r1, [r1, r2])).toEqual([]);
  });
});
