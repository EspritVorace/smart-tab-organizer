import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => key),
}));
vi.mock('../../src/utils/i18n.js', () => ({
  getMessage: vi.fn((key: string) => key),
}));

const { warnSpy } = vi.hoisted(() => ({
  warnSpy: vi.fn(),
}));
vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    log: vi.fn(),
    warn: warnSpy,
    error: vi.fn(),
  },
}));
vi.mock('../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    log: vi.fn(),
    warn: warnSpy,
    error: vi.fn(),
  },
}));

const validRule = {
  id: 'r1',
  domainFilter: 'aws.amazon.com',
  label: 'AWS Console',
  titleParsingRegEx: '',
  urlParsingRegEx: '',
  groupNameSource: 'smart',
  deduplicationMatchMode: 'exact',
  presetId: null,
  enabled: true,
};

const validPack = {
  version: 1,
  pack: { id: 'pack-cloud', name: 'Cloud', categoryId: 'cloud' },
  domainRules: [validRule],
};

const invalidPack = {
  version: 1,
  pack: { id: 'pack-broken', name: 'Broken' },
  domainRules: [validRule],
};

const orphanCategoryPack = {
  version: 1,
  pack: { id: 'pack-orphan', name: 'Orphan', categoryId: 'unknown-category' },
  domainRules: [validRule],
};

vi.mock('../../src/hooks/packDataSource', () => ({
  getPackSourceEntries: () => [
    { path: '/src/data/packs/valid.json', data: validPack },
    { path: '/src/data/packs/invalid.json', data: invalidPack },
    { path: '/src/data/packs/orphan.json', data: orphanCategoryPack },
  ],
  getCategoriesSource: () => ({
    categories: [
      { id: 'cloud', label: { en: 'Cloud', fr: 'Cloud' } },
      { id: 'dev', label: 'Development' },
    ],
  }),
}));

import { usePacks } from '../../src/hooks/usePacks';

describe('usePacks', () => {
  beforeEach(() => {
    warnSpy.mockClear();
  });

  it('expose seulement les packs valides + warn pour chaque rejet', () => {
    const { result } = renderHook(() => usePacks());

    expect(result.current.packs).toHaveLength(1);
    expect(result.current.packs[0].pack.id).toBe('pack-cloud');
    expect(result.current.categories).toHaveLength(2);
    expect(result.current.loadError).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it('trie les packs par ordre de categorie puis par nom', () => {
    const { result } = renderHook(() => usePacks());
    const ids = result.current.packs.map((p) => p.pack.id);
    expect(ids).toEqual(['pack-cloud']);
  });
});
