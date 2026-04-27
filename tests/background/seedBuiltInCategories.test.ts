import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import type { RuleCategory } from '../../src/schemas/category';

const BUILT_IN_SEED: RuleCategory[] = [
  { id: 'development', emoji: '💻', color: 'blue', labelKey: 'category_development', builtIn: true },
  { id: 'media', emoji: '🎬', color: 'red', labelKey: 'category_media', builtIn: true },
];

function mockOkFetch(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => body,
  });
}

beforeEach(() => {
  fakeBrowser.reset();
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('seedBuiltInCategories', () => {
  it('seed les built-ins depuis le JSON quand le storage est vide', async () => {
    vi.stubGlobal('fetch', mockOkFetch({ categories: BUILT_IN_SEED }));
    const { seedBuiltInCategories } = await import('../../src/background/migration');

    await seedBuiltInCategories();

    const { categories, categoriesSeeded } = await fakeBrowser.storage.local.get([
      'categories', 'categoriesSeeded',
    ]);
    expect(categories).toHaveLength(2);
    expect((categories as RuleCategory[])[0].id).toBe('development');
    expect(categoriesSeeded).toBe(true);
  });

  it('n\'écrase pas des catégories déjà présentes dans le storage', async () => {
    const fetchMock = mockOkFetch({ categories: BUILT_IN_SEED });
    vi.stubGlobal('fetch', fetchMock);
    const existing: RuleCategory[] = [
      { id: 'gaming', emoji: '🎮', color: 'purple', label: 'Gaming', builtIn: false },
    ];
    await fakeBrowser.storage.local.set({ categories: existing });

    const { seedBuiltInCategories } = await import('../../src/background/migration');
    await seedBuiltInCategories();

    const { categories, categoriesSeeded } = await fakeBrowser.storage.local.get([
      'categories', 'categoriesSeeded',
    ]);
    expect(categories).toEqual(existing);
    expect(categoriesSeeded).toBe(true);
    // fetch should not be called since existing data was present
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('est idempotent : ne refait rien si le flag categoriesSeeded est déjà posé', async () => {
    const fetchMock = mockOkFetch({ categories: BUILT_IN_SEED });
    vi.stubGlobal('fetch', fetchMock);
    await fakeBrowser.storage.local.set({ categoriesSeeded: true });

    const { seedBuiltInCategories } = await import('../../src/background/migration');
    await seedBuiltInCategories();

    expect(fetchMock).not.toHaveBeenCalled();
    const { categories } = await fakeBrowser.storage.local.get('categories');
    expect(categories).toBeUndefined();
  });

  it('ne pose pas le flag si fetch échoue (retry au prochain démarrage)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const { seedBuiltInCategories } = await import('../../src/background/migration');

    await seedBuiltInCategories();

    const { categoriesSeeded } = await fakeBrowser.storage.local.get('categoriesSeeded');
    expect(categoriesSeeded).toBeUndefined();
  });
});
