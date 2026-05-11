import { describe, it, expect } from 'vitest';
import {
  areDomainRulesEqual,
  getRuleDifferences,
  classifyImportedRules,
} from '../../src/utils/importClassification';
import type { DomainRuleSetting } from '../../src/types/syncSettings';

const makeRule = (overrides: Partial<DomainRuleSetting> = {}): DomainRuleSetting => ({
  id: '1',
  enabled: true,
  domainFilter: 'example.com',
  label: 'Example',
  titleParsingRegEx: '(.*)',
  urlParsingRegEx: '',
  groupNameSource: 'title',
  deduplicationMatchMode: 'exact',
  deduplicationEnabled: true,
  presetId: null,
  ...overrides,
});

describe('importClassification', () => {
  describe('areDomainRulesEqual', () => {
    it('returns true for identical rules', () => {
      const rule = makeRule();
      expect(areDomainRulesEqual(rule, { ...rule })).toBe(true);
    });

    it('ignores differences on id and badge', () => {
      const ruleA = makeRule({ id: 'aaa', badge: 'new' as any });
      const ruleB = makeRule({ id: 'bbb', badge: undefined });
      expect(areDomainRulesEqual(ruleA, ruleB)).toBe(true);
    });

    it('treats undefined ignoredQueryParams as an empty array', () => {
      // Rule seeded before the field existed (undefined) vs rule parsed via
      // Zod import schema (defaults to []). Should still be considered equal.
      const existing = makeRule({ ignoredQueryParams: undefined as any });
      const imported = makeRule({ ignoredQueryParams: [] });
      expect(areDomainRulesEqual(existing, imported)).toBe(true);
    });

    it('distinguishes two different ignoredQueryParams lists', () => {
      const ruleA = makeRule({ ignoredQueryParams: ['utm_source'] });
      const ruleB = makeRule({ ignoredQueryParams: ['utm_medium'] });
      expect(areDomainRulesEqual(ruleA, ruleB)).toBe(false);
    });

    it('returns false when domainFilter differs', () => {
      const ruleA = makeRule({ domainFilter: 'foo.com' });
      const ruleB = makeRule({ domainFilter: 'bar.com' });
      expect(areDomainRulesEqual(ruleA, ruleB)).toBe(false);
    });

    it('returns false when enabled differs', () => {
      const ruleA = makeRule({ enabled: true });
      const ruleB = makeRule({ enabled: false });
      expect(areDomainRulesEqual(ruleA, ruleB)).toBe(false);
    });

    it('returns false when deduplicationMatchMode differs', () => {
      const ruleA = makeRule({ deduplicationMatchMode: 'exact' });
      const ruleB = makeRule({ deduplicationMatchMode: 'hostname' });
      expect(areDomainRulesEqual(ruleA, ruleB)).toBe(false);
    });

    it('returns false when deduplicationEnabled differs', () => {
      const ruleA = makeRule({ deduplicationEnabled: true });
      const ruleB = makeRule({ deduplicationEnabled: false });
      expect(areDomainRulesEqual(ruleA, ruleB)).toBe(false);
    });

    it('returns false when color differs', () => {
      const ruleA = makeRule({ color: 'blue' });
      const ruleB = makeRule({ color: 'red' });
      expect(areDomainRulesEqual(ruleA, ruleB)).toBe(false);
    });

    it('returns false when presetId differs', () => {
      const ruleA = makeRule({ presetId: null });
      const ruleB = makeRule({ presetId: 'some-preset' });
      expect(areDomainRulesEqual(ruleA, ruleB)).toBe(false);
    });
  });

  describe('getRuleDifferences', () => {
    it('returns an empty array for identical rules', () => {
      const rule = makeRule();
      expect(getRuleDifferences(rule, { ...rule })).toHaveLength(0);
    });

    it('detects differences on domainFilter', () => {
      const current = makeRule({ domainFilter: 'foo.com' });
      const imported = makeRule({ domainFilter: 'bar.com' });
      const diffs = getRuleDifferences(current, imported);
      expect(diffs).toHaveLength(1);
      expect(diffs[0]).toMatchObject({
        property: 'domainFilter',
        currentValue: 'foo.com',
        importedValue: 'bar.com',
      });
    });

    it('detects multiple differences', () => {
      const current = makeRule({ domainFilter: 'foo.com', deduplicationMatchMode: 'exact' });
      const imported = makeRule({ domainFilter: 'bar.com', deduplicationMatchMode: 'hostname' });
      const diffs = getRuleDifferences(current, imported);
      expect(diffs).toHaveLength(2);
      const props = diffs.map(d => d.property);
      expect(props).toContain('domainFilter');
      expect(props).toContain('deduplicationMatchMode');
    });

    it('includes label in the differences (rename surfaced)', () => {
      const current = makeRule({ label: 'A' });
      const imported = makeRule({ label: 'B' });
      const diffs = getRuleDifferences(current, imported);
      const labelDiff = diffs.find(d => d.property === 'label');
      expect(labelDiff).toBeDefined();
      expect(labelDiff).toMatchObject({ currentValue: 'A', importedValue: 'B' });
    });

    it('detects a difference on enabled', () => {
      const current = makeRule({ enabled: true });
      const imported = makeRule({ enabled: false });
      const diffs = getRuleDifferences(current, imported);
      expect(diffs).toHaveLength(1);
      expect(diffs[0].property).toBe('enabled');
    });
  });

  describe('classifyImportedRules', () => {
    it('classifies a rule with no match as new', () => {
      const imported = [makeRule({ label: 'New Rule' })];
      const result = classifyImportedRules(imported, []);
      expect(result.newRules).toHaveLength(1);
      expect(result.conflictingRules).toHaveLength(0);
      expect(result.identicalRules).toHaveLength(0);
    });

    it('classifies an identical rule correctly', () => {
      const rule = makeRule({ label: 'Same Rule' });
      const result = classifyImportedRules([rule], [{ ...rule }]);
      expect(result.identicalRules).toHaveLength(1);
      expect(result.newRules).toHaveLength(0);
      expect(result.conflictingRules).toHaveLength(0);
    });

    it('classifies a rule as a conflict (same label, different fields)', () => {
      const existing = makeRule({ label: 'Conflict', domainFilter: 'foo.com' });
      const imported = makeRule({ label: 'Conflict', domainFilter: 'bar.com' });
      const result = classifyImportedRules([imported], [existing]);
      expect(result.conflictingRules).toHaveLength(1);
      expect(result.conflictingRules[0].differences).toHaveLength(1);
      expect(result.newRules).toHaveLength(0);
      expect(result.identicalRules).toHaveLength(0);
    });

    it('is case-insensitive when matching labels (lookup)', () => {
      const existing = makeRule({ id: 'a', label: 'My Rule' });
      const imported = makeRule({ id: 'b', label: 'MY RULE' }); // same label, different case, different id
      const result = classifyImportedRules([imported], [existing]);
      // Different id -> label fallback (case-insensitive) -> match.
      expect(result.newRules).toHaveLength(0);
      // areDomainRulesEqual compares label with === -> treated as a conflict.
      // (label appears in the differences to surface the case change)
      expect(result.conflictingRules).toHaveLength(1);
      expect(result.conflictingRules[0].differences).toHaveLength(1);
      expect(result.conflictingRules[0].differences[0].property).toBe('label');
    });

    it('matches by id first (catches renames)', () => {
      const existing = makeRule({ id: 'stable-id', label: 'Old Label' });
      const imported = makeRule({ id: 'stable-id', label: 'New Label' });
      const result = classifyImportedRules([imported], [existing]);
      expect(result.conflictingRules).toHaveLength(1);
      expect(result.conflictingRules[0].existing).toBe(existing);
      expect(result.conflictingRules[0].differences.map(d => d.property)).toContain('label');
      expect(result.newRules).toHaveLength(0);
      expect(result.identicalRules).toHaveLength(0);
    });

    it('classifies an identical rule by id (same content, same label)', () => {
      const rule = makeRule({ id: 'stable-id', label: 'Foo' });
      const result = classifyImportedRules([rule], [{ ...rule }]);
      expect(result.identicalRules).toHaveLength(1);
      expect(result.conflictingRules).toHaveLength(0);
      expect(result.newRules).toHaveLength(0);
    });

    it('uses the label fallback when the id does not match', () => {
      const existing = makeRule({ id: 'aaa', label: 'Foo', domainFilter: 'foo.com' });
      const imported = makeRule({ id: 'bbb', label: 'Foo', domainFilter: 'bar.com' });
      const result = classifyImportedRules([imported], [existing]);
      expect(result.conflictingRules).toHaveLength(1);
      expect(result.conflictingRules[0].existing).toBe(existing);
      expect(result.newRules).toHaveLength(0);
    });

    it('does not re-match an existing rule already paired by id', () => {
      // Existing has rule "Foo" with id A. Two imports both have label "Foo":
      // one with id A (matches by id), the other with id B (would fall back
      // to label, but A is already taken, so it becomes new).
      const existing = makeRule({ id: 'A', label: 'Foo' });
      const importedById = makeRule({ id: 'A', label: 'Foo', domainFilter: 'changed.com' });
      const importedByLabel = makeRule({ id: 'B', label: 'Foo' });
      const result = classifyImportedRules([importedById, importedByLabel], [existing]);
      expect(result.conflictingRules).toHaveLength(1);
      expect(result.conflictingRules[0].imported).toBe(importedById);
      expect(result.newRules).toHaveLength(1);
      expect(result.newRules[0]).toBe(importedByLabel);
    });

    it('handles a mix of classifications', () => {
      const existing = [
        makeRule({ id: '1', label: 'Identical' }),
        makeRule({ id: '2', label: 'Conflict', domainFilter: 'old.com' }),
      ];
      const imported = [
        makeRule({ id: '3', label: 'New' }),
        makeRule({ id: '4', label: 'Identical' }),
        makeRule({ id: '5', label: 'Conflict', domainFilter: 'new.com' }),
      ];
      const result = classifyImportedRules(imported, existing);
      expect(result.newRules).toHaveLength(1);
      expect(result.identicalRules).toHaveLength(1);
      expect(result.conflictingRules).toHaveLength(1);
    });

    it('returns empty arrays when no rules are imported', () => {
      const existing = [makeRule()];
      const result = classifyImportedRules([], existing);
      expect(result.newRules).toHaveLength(0);
      expect(result.conflictingRules).toHaveLength(0);
      expect(result.identicalRules).toHaveLength(0);
    });

    it('classifies every rule as new when no existing rules are provided', () => {
      const imported = [makeRule({ label: 'A' }), makeRule({ label: 'B' })];
      const result = classifyImportedRules(imported, []);
      expect(result.newRules).toHaveLength(2);
    });
  });
});
