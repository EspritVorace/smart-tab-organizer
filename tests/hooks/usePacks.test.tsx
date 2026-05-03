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

describe('usePacks (catégories invalides)', () => {
  beforeEach(() => {
    warnSpy.mockClear();
    vi.resetModules();
  });

  it('expose loadError quand le fichier de catégories est invalide', async () => {
    vi.doMock('../../src/hooks/packDataSource', () => ({
      getPackSourceEntries: () => [],
      getCategoriesSource: () => ({ wrong: 'shape' }),
    }));
    const { usePacks: usePacksReloaded } = await import('../../src/hooks/usePacks');

    const { result } = renderHook(() => usePacksReloaded());
    expect(result.current.loadError).toMatch(/invalid/i);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('trie deux packs partageant la même catégorie par nom', async () => {
    vi.doMock('../../src/hooks/packDataSource', () => ({
      getPackSourceEntries: () => [
        {
          path: '/p2.json',
          data: {
            version: 1,
            pack: { id: 'b-pack', name: 'Beta', categoryId: 'cloud' },
            domainRules: [validRule],
          },
        },
        {
          path: '/p1.json',
          data: {
            version: 1,
            pack: { id: 'a-pack', name: 'Alpha', categoryId: 'cloud' },
            domainRules: [validRule],
          },
        },
      ],
      getCategoriesSource: () => ({
        categories: [{ id: 'cloud', label: 'Cloud' }],
      }),
    }));
    const { usePacks: usePacksReloaded } = await import('../../src/hooks/usePacks');

    const { result } = renderHook(() => usePacksReloaded());
    expect(result.current.packs.map((p) => p.pack.id)).toEqual(['a-pack', 'b-pack']);
  });

  it('classe en dernier les packs sans categoryId', async () => {
    vi.doMock('../../src/hooks/packDataSource', () => ({
      getPackSourceEntries: () => [
        {
          path: '/p1.json',
          data: {
            version: 1,
            pack: { id: 'no-cat', name: 'Aaa Pack', category: 'Misc' },
            domainRules: [validRule],
          },
        },
        {
          path: '/p2.json',
          data: {
            version: 1,
            pack: { id: 'cloud-pack', name: 'Zeta Pack', categoryId: 'cloud' },
            domainRules: [validRule],
          },
        },
      ],
      getCategoriesSource: () => ({
        categories: [{ id: 'cloud', label: 'Cloud' }],
      }),
    }));
    const { usePacks: usePacksReloaded } = await import('../../src/hooks/usePacks');

    const { result } = renderHook(() => usePacksReloaded());
    expect(result.current.packs.map((p) => p.pack.id)).toEqual(['cloud-pack', 'no-cat']);
  });
});
