import { describe, it, expect } from 'vitest';
import {
  getRootDomain,
  getRulesForRootDomain,
  moveToFirst,
  moveToLast,
  moveToFirstOfDomain,
  moveToLastOfDomain,
  applyDragReorder,
} from '../../src/utils/ruleOrderUtils';
import type { DomainRuleSetting } from '../../src/types/syncSettings';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const makeRule = (id: string, domainFilter: string): DomainRuleSetting => ({
  id,
  domainFilter,
  label: `Rule ${id}`,
  titleParsingRegEx: '',
  urlParsingRegEx: '',
  groupNameSource: 'title',
  deduplicationMatchMode: 'exact',
  deduplicationEnabled: true,
  presetId: null,
  enabled: true,
});

/* ── getRootDomain ─────────────────────────────────────────────────────────── */

describe('getRootDomain', () => {
  it('returns domain as-is when it has 2 segments', () => {
    expect(getRootDomain('example.com')).toBe('example.com');
  });

  it('returns last 2 segments for a subdomain', () => {
    expect(getRootDomain('sub.example.com')).toBe('example.com');
  });

  it('returns last 2 segments for a deep subdomain', () => {
    expect(getRootDomain('a.b.c.example.com')).toBe('example.com');
  });

  it('returns "localhost" for localhost', () => {
    expect(getRootDomain('localhost')).toBe('localhost');
  });

  it('returns "__regex__" for patterns with regex metacharacters', () => {
    expect(getRootDomain('[a-z]+\\.example\\.com')).toBe('__regex__');
    expect(getRootDomain('example\\.')).toBe('__regex__');
    expect(getRootDomain('foo.*')).toBe('__regex__');
  });

  it('returns "__empty__" for empty string', () => {
    expect(getRootDomain('')).toBe('__empty__');
  });
});

/* ── getRulesForRootDomain ────────────────────────────────────────────────── */

describe('getRulesForRootDomain', () => {
  const rules = [
    makeRule('a', 'example.com'),
    makeRule('b', 'sub.example.com'),
    makeRule('c', 'github.com'),
    makeRule('d', 'api.github.com'),
  ];

  it('groups example.com and sub.example.com together', () => {
    const result = getRulesForRootDomain(rules, 'example.com');
    expect(result.map(r => r.id)).toEqual(['a', 'b']);
  });

  it('groups github.com and api.github.com together', () => {
    const result = getRulesForRootDomain(rules, 'api.github.com');
    expect(result.map(r => r.id)).toEqual(['c', 'd']);
  });

  it('returns only one rule when domain is unique', () => {
    const result = getRulesForRootDomain([makeRule('x', 'unique.org')], 'unique.org');
    expect(result).toHaveLength(1);
  });
});

/* ── moveToFirst ──────────────────────────────────────────────────────────── */

describe('moveToFirst', () => {
  const rules = ['a', 'b', 'c', 'd'].map(id => makeRule(id, 'example.com'));

  it('moves a rule from last to first', () => {
    expect(moveToFirst(rules, 'd').map(r => r.id)).toEqual(['d', 'a', 'b', 'c']);
  });

  it('moves a rule from middle to first', () => {
    expect(moveToFirst(rules, 'b').map(r => r.id)).toEqual(['b', 'a', 'c', 'd']);
  });

  it('is a no-op when rule is already first', () => {
    const result = moveToFirst(rules, 'a');
    expect(result.map(r => r.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('is a no-op for unknown id', () => {
    const result = moveToFirst(rules, 'unknown');
    expect(result.map(r => r.id)).toEqual(['a', 'b', 'c', 'd']);
  });
});

/* ── moveToLast ───────────────────────────────────────────────────────────── */

describe('moveToLast', () => {
  const rules = ['a', 'b', 'c', 'd'].map(id => makeRule(id, 'example.com'));

  it('moves a rule from first to last', () => {
    expect(moveToLast(rules, 'a').map(r => r.id)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('moves a rule from middle to last', () => {
    expect(moveToLast(rules, 'b').map(r => r.id)).toEqual(['a', 'c', 'd', 'b']);
  });

  it('is a no-op when rule is already last', () => {
    const result = moveToLast(rules, 'd');
    expect(result.map(r => r.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('is a no-op for unknown id', () => {
    const result = moveToLast(rules, 'unknown');
    expect(result.map(r => r.id)).toEqual(['a', 'b', 'c', 'd']);
  });
});

/* ── moveToFirstOfDomain ──────────────────────────────────────────────────── */

describe('moveToFirstOfDomain', () => {
  it('moves rule to just before the first rule of same root domain', () => {
    const rules = [
      makeRule('gh1', 'github.com'),
      makeRule('ex1', 'example.com'),
      makeRule('ex2', 'sub.example.com'),
      makeRule('gh2', 'api.github.com'),
    ];
    // Move gh2 (api.github.com → root: github.com) to first of its domain (gh1 at index 0)
    expect(moveToFirstOfDomain(rules, 'gh2').map(r => r.id)).toEqual(['gh2', 'gh1', 'ex1', 'ex2']);
  });

  it('is a no-op when rule is already first of its domain', () => {
    const rules = [
      makeRule('ex1', 'example.com'),
      makeRule('ex2', 'sub.example.com'),
      makeRule('gh1', 'github.com'),
    ];
    const result = moveToFirstOfDomain(rules, 'ex1');
    expect(result.map(r => r.id)).toEqual(['ex1', 'ex2', 'gh1']);
  });

  it('handles non-contiguous rules of same domain', () => {
    const rules = [
      makeRule('ex1', 'example.com'),
      makeRule('gh1', 'github.com'),
      makeRule('ex2', 'sub.example.com'),
    ];
    // Move ex2 to first of domain (example.com). ex1 is at index 0.
    expect(moveToFirstOfDomain(rules, 'ex2').map(r => r.id)).toEqual(['ex2', 'ex1', 'gh1']);
  });
});

/* ── moveToLastOfDomain ───────────────────────────────────────────────────── */

describe('moveToLastOfDomain', () => {
  it('moves rule to just after the last rule of same root domain', () => {
    const rules = [
      makeRule('ex1', 'example.com'),
      makeRule('ex2', 'sub.example.com'),
      makeRule('gh1', 'github.com'),
      makeRule('gh2', 'api.github.com'),
    ];
    // Move ex1 (root: example.com) to last of domain (ex2 at index 1)
    expect(moveToLastOfDomain(rules, 'ex1').map(r => r.id)).toEqual(['ex2', 'ex1', 'gh1', 'gh2']);
  });

  it('is a no-op when rule is already last of its domain', () => {
    const rules = [
      makeRule('ex1', 'example.com'),
      makeRule('ex2', 'sub.example.com'),
      makeRule('gh1', 'github.com'),
    ];
    const result = moveToLastOfDomain(rules, 'ex2');
    expect(result.map(r => r.id)).toEqual(['ex1', 'ex2', 'gh1']);
  });

  it('handles non-contiguous rules of same domain', () => {
    const rules = [
      makeRule('ex1', 'example.com'),
      makeRule('gh1', 'github.com'),
      makeRule('ex2', 'sub.example.com'),
    ];
    // Move ex1 to last of domain (ex2 at index 2)
    expect(moveToLastOfDomain(rules, 'ex1').map(r => r.id)).toEqual(['gh1', 'ex2', 'ex1']);
  });
});

/* ── applyDragReorder ─────────────────────────────────────────────────────── */

describe('applyDragReorder', () => {
  const rules = ['a', 'b', 'c', 'd'].map(id => makeRule(id, 'example.com'));

  it('moves element from index 2 to index 0 in full list', () => {
    const filteredIds = ['a', 'b', 'c', 'd'];
    const result = applyDragReorder(rules, filteredIds, 'c', 'a');
    expect(result.map(r => r.id)).toEqual(['c', 'a', 'b', 'd']);
  });

  it('moves element from index 0 to last in full list', () => {
    const filteredIds = ['a', 'b', 'c', 'd'];
    const result = applyDragReorder(rules, filteredIds, 'a', 'd');
    expect(result.map(r => r.id)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('is a no-op when activeId === overId', () => {
    const filteredIds = ['a', 'b', 'c', 'd'];
    const result = applyDragReorder(rules, filteredIds, 'b', 'b');
    expect(result.map(r => r.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('preserves non-filtered rules at their original positions', () => {
    // Only 'a' and 'c' are visible (filtered); 'b' and 'd' are hidden
    const filteredIds = ['a', 'c'];
    const result = applyDragReorder(rules, filteredIds, 'c', 'a');
    // 'b' stays at index 1, 'd' stays at index 3; 'a' and 'c' swap
    expect(result.map(r => r.id)).toEqual(['c', 'b', 'a', 'd']);
  });
});
