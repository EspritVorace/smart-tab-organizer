import { describe, it, expect } from 'vitest';
import { validateCatalog } from '../../src/exploration/validateCatalog';
import { CATALOG, type CatalogEntry } from '../../src/exploration/catalog';

describe('validateCatalog (real catalogue)', () => {
  it('passes all structural invariants', () => {
    const result = validateCatalog();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('has unique ids', () => {
    const ids = CATALOG.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

const base: CatalogEntry = {
  id: 'x',
  domain: 'grouping',
  labelKey: 'x',
  descriptionKey: 'x',
  uiTarget: '#',
  detect: 'touchpoint',
};

describe('validateCatalog (synthetic)', () => {
  it('rejects duplicate ids', () => {
    const result = validateCatalog([base, { ...base }]);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('Duplicate'))).toBe(true);
  });

  it('rejects an unknown prerequisite id', () => {
    const result = validateCatalog([{ ...base, prerequisites: 'does-not-exist' }]);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('unknown id'))).toBe(true);
  });

  it('rejects an invalid domain', () => {
    const result = validateCatalog([{ ...base, domain: 'nope' as CatalogEntry['domain'] }]);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('invalid domain'))).toBe(true);
  });

  it('rejects a prerequisite cycle', () => {
    const a: CatalogEntry = { ...base, id: 'a', prerequisites: 'b' };
    const b: CatalogEntry = { ...base, id: 'b', prerequisites: 'a' };
    const result = validateCatalog([a, b]);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('cycle'))).toBe(true);
  });

  it('accepts an acyclic diamond', () => {
    const entries: CatalogEntry[] = [
      { ...base, id: 'a' },
      { ...base, id: 'b', prerequisites: 'a' },
      { ...base, id: 'c', prerequisites: 'a' },
      { ...base, id: 'd', prerequisites: { allOf: ['b', 'c'] } },
    ];
    expect(validateCatalog(entries).ok).toBe(true);
  });
});
