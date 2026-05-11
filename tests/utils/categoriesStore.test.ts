import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import type { RuleCategory } from '../../src/schemas/category';

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => `i18n(${key})`),
}));

const SAMPLE_CATEGORIES: RuleCategory[] = [
  { id: 'development', emoji: '💻', labelKey: 'category_development', builtIn: true },
  { id: 'media', emoji: '🎬', labelKey: 'category_media', builtIn: true },
  { id: 'gaming', emoji: '🎮', label: 'Gaming', builtIn: false },
];

beforeEach(() => {
  fakeBrowser.reset();
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('initCategoriesStore', () => {
  it('populates the cache from storage on first call', async () => {
    await fakeBrowser.storage.local.set({ categories: SAMPLE_CATEGORIES });
    const { initCategoriesStore, getAllCategories } = await import('../../src/utils/categoriesStore');

    await initCategoriesStore();

    expect(getAllCategories()).toHaveLength(3);
    expect(getAllCategories()[0].id).toBe('development');
  });

  it('returns an empty cache when storage is empty', async () => {
    const { initCategoriesStore, getAllCategories } = await import('../../src/utils/categoriesStore');

    await initCategoriesStore();

    expect(getAllCategories()).toEqual([]);
  });

  it('is idempotent across multiple calls', async () => {
    await fakeBrowser.storage.local.set({ categories: SAMPLE_CATEGORIES });
    const { initCategoriesStore, getAllCategories } = await import('../../src/utils/categoriesStore');

    await initCategoriesStore();
    await initCategoriesStore();

    expect(getAllCategories()).toHaveLength(3);
  });
});

describe('getRuleCategory', () => {
  it('returns the category matching the id', async () => {
    await fakeBrowser.storage.local.set({ categories: SAMPLE_CATEGORIES });
    const { initCategoriesStore, getRuleCategory } = await import('../../src/utils/categoriesStore');
    await initCategoriesStore();

    const cat = getRuleCategory('development');
    expect(cat?.emoji).toBe('💻');
  });

  it('returns null for an unknown id', async () => {
    await fakeBrowser.storage.local.set({ categories: SAMPLE_CATEGORIES });
    const { initCategoriesStore, getRuleCategory } = await import('../../src/utils/categoriesStore');
    await initCategoriesStore();

    expect(getRuleCategory('unknown')).toBeNull();
  });

  it('returns null for null/undefined/empty string', async () => {
    await fakeBrowser.storage.local.set({ categories: SAMPLE_CATEGORIES });
    const { initCategoriesStore, getRuleCategory } = await import('../../src/utils/categoriesStore');
    await initCategoriesStore();

    expect(getRuleCategory(null)).toBeNull();
    expect(getRuleCategory(undefined)).toBeNull();
    expect(getRuleCategory('')).toBeNull();
  });
});

describe('getCategoryLabel', () => {
  it('resolves labelKey via getMessage for built-ins', async () => {
    const { getCategoryLabel } = await import('../../src/utils/categoriesStore');
    const cat: RuleCategory = { id: 'x', emoji: '✨', labelKey: 'category_x', builtIn: true };

    expect(getCategoryLabel(cat)).toBe('i18n(category_x)');
  });

  it('uses the raw label for custom categories', async () => {
    const { getCategoryLabel } = await import('../../src/utils/categoriesStore');
    const cat: RuleCategory = { id: 'x', emoji: '✨', label: 'Custom Label', builtIn: false };

    expect(getCategoryLabel(cat)).toBe('Custom Label');
  });

  it('prefers labelKey over label when both are present', async () => {
    const { getCategoryLabel } = await import('../../src/utils/categoriesStore');
    const cat: RuleCategory = {
      id: 'x',
      emoji: '✨',
      labelKey: 'category_x',
      label: 'Fallback',
      builtIn: true,
    };

    expect(getCategoryLabel(cat)).toBe('i18n(category_x)');
  });
});

describe('initCategoriesStore: external storage updates + reset', () => {
  it('updates the cache when storage changes after init', async () => {
    await fakeBrowser.storage.local.set({ categories: SAMPLE_CATEGORIES });
    const { initCategoriesStore, getAllCategories, _resetCategoriesStoreForTests } =
      await import('../../src/utils/categoriesStore');

    await initCategoriesStore();
    expect(getAllCategories()).toHaveLength(3);

    // External update
    const next: RuleCategory[] = [
      { id: 'gaming', emoji: '🎮', label: 'Gaming', builtIn: false },
    ];
    await fakeBrowser.storage.local.set({ categories: next });

    // Watcher should refresh the cache.
    await new Promise((r) => setTimeout(r, 10));
    expect(getAllCategories()).toHaveLength(1);
    expect(getAllCategories()[0].id).toBe('gaming');

    _resetCategoriesStoreForTests();
    expect(getAllCategories()).toEqual([]);
  });

  it('falls back to an empty cache when getValue throws', async () => {
    const mod = await import('../../src/utils/categoriesStore');
    const { initCategoriesStore, getAllCategories, _resetCategoriesStoreForTests } = mod;
    const { getActiveScopedItems } = await import('../../src/utils/workspaceContext');
    const items = await getActiveScopedItems();

    _resetCategoriesStoreForTests();
    vi.spyOn(items.categoriesItem, 'getValue').mockRejectedValueOnce(new Error('boom'));

    await initCategoriesStore();
    expect(getAllCategories()).toEqual([]);
  });
});

describe('fetchBuiltInCategories', () => {
  it('downloads and validates the categories.json file', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ categories: SAMPLE_CATEGORIES }),
      }),
    );
    const { fetchBuiltInCategories } = await import('../../src/utils/categoriesStore');

    const result = await fetchBuiltInCategories();

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('development');
  });

  it('throws when the HTTP response is not OK', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }),
    );
    const { fetchBuiltInCategories } = await import('../../src/utils/categoriesStore');

    await expect(fetchBuiltInCategories()).rejects.toThrow();
  });

  it('throws when the JSON does not match the schema', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ not: 'the right shape' }),
      }),
    );
    const { fetchBuiltInCategories } = await import('../../src/utils/categoriesStore');

    await expect(fetchBuiltInCategories()).rejects.toThrow();
  });
});
