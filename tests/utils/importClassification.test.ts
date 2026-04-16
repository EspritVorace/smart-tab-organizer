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
    it('retourne true pour des règles identiques', () => {
      const rule = makeRule();
      expect(areDomainRulesEqual(rule, { ...rule })).toBe(true);
    });

    it('ignore les différences de id et badge', () => {
      const ruleA = makeRule({ id: 'aaa', badge: 'new' as any });
      const ruleB = makeRule({ id: 'bbb', badge: undefined });
      expect(areDomainRulesEqual(ruleA, ruleB)).toBe(true);
    });

    it('traite ignoredQueryParams undefined comme un tableau vide', () => {
      // Rule seeded before the field existed (undefined) vs rule parsed via
      // Zod import schema (defaults to []). Should still be considered equal.
      const existing = makeRule({ ignoredQueryParams: undefined as any });
      const imported = makeRule({ ignoredQueryParams: [] });
      expect(areDomainRulesEqual(existing, imported)).toBe(true);
    });

    it('distingue deux listes ignoredQueryParams différentes', () => {
      const ruleA = makeRule({ ignoredQueryParams: ['utm_source'] });
      const ruleB = makeRule({ ignoredQueryParams: ['utm_medium'] });
      expect(areDomainRulesEqual(ruleA, ruleB)).toBe(false);
    });

    it('retourne false si domainFilter diffère', () => {
      const ruleA = makeRule({ domainFilter: 'foo.com' });
      const ruleB = makeRule({ domainFilter: 'bar.com' });
      expect(areDomainRulesEqual(ruleA, ruleB)).toBe(false);
    });

    it('retourne false si enabled diffère', () => {
      const ruleA = makeRule({ enabled: true });
      const ruleB = makeRule({ enabled: false });
      expect(areDomainRulesEqual(ruleA, ruleB)).toBe(false);
    });

    it('retourne false si deduplicationMatchMode diffère', () => {
      const ruleA = makeRule({ deduplicationMatchMode: 'exact' });
      const ruleB = makeRule({ deduplicationMatchMode: 'hostname' });
      expect(areDomainRulesEqual(ruleA, ruleB)).toBe(false);
    });

    it('retourne false si deduplicationEnabled diffère', () => {
      const ruleA = makeRule({ deduplicationEnabled: true });
      const ruleB = makeRule({ deduplicationEnabled: false });
      expect(areDomainRulesEqual(ruleA, ruleB)).toBe(false);
    });

    it('retourne false si color diffère', () => {
      const ruleA = makeRule({ color: 'blue' });
      const ruleB = makeRule({ color: 'red' });
      expect(areDomainRulesEqual(ruleA, ruleB)).toBe(false);
    });

    it('retourne false si presetId diffère', () => {
      const ruleA = makeRule({ presetId: null });
      const ruleB = makeRule({ presetId: 'some-preset' });
      expect(areDomainRulesEqual(ruleA, ruleB)).toBe(false);
    });
  });

  describe('getRuleDifferences', () => {
    it('retourne un tableau vide pour des règles identiques', () => {
      const rule = makeRule();
      expect(getRuleDifferences(rule, { ...rule })).toHaveLength(0);
    });

    it('détecte les différences sur domainFilter', () => {
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

    it('détecte plusieurs différences', () => {
      const current = makeRule({ domainFilter: 'foo.com', deduplicationMatchMode: 'exact' });
      const imported = makeRule({ domainFilter: 'bar.com', deduplicationMatchMode: 'hostname' });
      const diffs = getRuleDifferences(current, imported);
      expect(diffs).toHaveLength(2);
      const props = diffs.map(d => d.property);
      expect(props).toContain('domainFilter');
      expect(props).toContain('deduplicationMatchMode');
    });

    it('exclut label des différences (clé de correspondance)', () => {
      const current = makeRule({ label: 'A' });
      const imported = makeRule({ label: 'B' });
      const diffs = getRuleDifferences(current, imported);
      expect(diffs.find(d => d.property === 'label')).toBeUndefined();
    });

    it('détecte une différence sur enabled', () => {
      const current = makeRule({ enabled: true });
      const imported = makeRule({ enabled: false });
      const diffs = getRuleDifferences(current, imported);
      expect(diffs).toHaveLength(1);
      expect(diffs[0].property).toBe('enabled');
    });
  });

  describe('classifyImportedRules', () => {
    it('classe une règle sans correspondance comme nouvelle', () => {
      const imported = [makeRule({ label: 'New Rule' })];
      const result = classifyImportedRules(imported, []);
      expect(result.newRules).toHaveLength(1);
      expect(result.conflictingRules).toHaveLength(0);
      expect(result.identicalRules).toHaveLength(0);
    });

    it('classe une règle identique correctement', () => {
      const rule = makeRule({ label: 'Same Rule' });
      const result = classifyImportedRules([rule], [{ ...rule }]);
      expect(result.identicalRules).toHaveLength(1);
      expect(result.newRules).toHaveLength(0);
      expect(result.conflictingRules).toHaveLength(0);
    });

    it('classe une règle avec conflit (même label, champs différents)', () => {
      const existing = makeRule({ label: 'Conflict', domainFilter: 'foo.com' });
      const imported = makeRule({ label: 'Conflict', domainFilter: 'bar.com' });
      const result = classifyImportedRules([imported], [existing]);
      expect(result.conflictingRules).toHaveLength(1);
      expect(result.conflictingRules[0].differences).toHaveLength(1);
      expect(result.newRules).toHaveLength(0);
      expect(result.identicalRules).toHaveLength(0);
    });

    it('est insensible à la casse pour la correspondance des labels (lookup)', () => {
      const existing = makeRule({ label: 'My Rule' });
      const imported = makeRule({ label: 'MY RULE' }); // même label, casse différente
      const result = classifyImportedRules([imported], [existing]);
      // Retrouvée dans la map (insensible à la casse) → pas nouvelle
      expect(result.newRules).toHaveLength(0);
      // Mais areDomainRulesEqual compare label en === → considérée comme conflit
      // (avec 0 différences visibles car label est ignoré dans getRuleDifferences)
      expect(result.conflictingRules).toHaveLength(1);
      expect(result.conflictingRules[0].differences).toHaveLength(0);
    });

    it('gère un mélange de classifications', () => {
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

    it('retourne des tableaux vides si aucune règle importée', () => {
      const existing = [makeRule()];
      const result = classifyImportedRules([], existing);
      expect(result.newRules).toHaveLength(0);
      expect(result.conflictingRules).toHaveLength(0);
      expect(result.identicalRules).toHaveLength(0);
    });

    it('classe toutes les règles comme nouvelles si aucune règle existante', () => {
      const imported = [makeRule({ label: 'A' }), makeRule({ label: 'B' })];
      const result = classifyImportedRules(imported, []);
      expect(result.newRules).toHaveLength(2);
    });
  });
});
