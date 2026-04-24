import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import type { RuleCategory } from '../../src/schemas/category';

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => `i18n(${key})`),
}));

const SAMPLE_CATEGORIES: RuleCategory[] = [
  { id: 'development', emoji: '💻', color: 'blue', labelKey: 'category_development', builtIn: true },
  { id: 'media', emoji: '🎬', color: 'red', labelKey: 'category_media', builtIn: true },
  { id: 'gaming', emoji: '🎮', color: 'purple', label: 'Gaming', builtIn: false },
];

beforeEach(() => {
  fakeBrowser.reset();
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('initCategoriesStore', () => {
  it('remplit le cache depuis storage au premier appel', async () => {
    await fakeBrowser.storage.local.set({ categories: SAMPLE_CATEGORIES });
    const { initCategoriesStore, getAllCategories } = await import('../../src/utils/categoriesStore');

    await initCategoriesStore();

    expect(getAllCategories()).toHaveLength(3);
    expect(getAllCategories()[0].id).toBe('development');
  });

  it('retourne un cache vide si storage est vide', async () => {
    const { initCategoriesStore, getAllCategories } = await import('../../src/utils/categoriesStore');

    await initCategoriesStore();

    expect(getAllCategories()).toEqual([]);
  });

  it('est idempotent sur plusieurs appels', async () => {
    await fakeBrowser.storage.local.set({ categories: SAMPLE_CATEGORIES });
    const { initCategoriesStore, getAllCategories } = await import('../../src/utils/categoriesStore');

    await initCategoriesStore();
    await initCategoriesStore();

    expect(getAllCategories()).toHaveLength(3);
  });
});

describe('getRuleCategory', () => {
  it('retourne la catégorie correspondante à l\'id', async () => {
    await fakeBrowser.storage.local.set({ categories: SAMPLE_CATEGORIES });
    const { initCategoriesStore, getRuleCategory } = await import('../../src/utils/categoriesStore');
    await initCategoriesStore();

    const cat = getRuleCategory('development');
    expect(cat?.emoji).toBe('💻');
  });

  it('retourne null pour un id inconnu', async () => {
    await fakeBrowser.storage.local.set({ categories: SAMPLE_CATEGORIES });
    const { initCategoriesStore, getRuleCategory } = await import('../../src/utils/categoriesStore');
    await initCategoriesStore();

    expect(getRuleCategory('unknown')).toBeNull();
  });

  it('retourne null pour null/undefined/chaîne vide', async () => {
    await fakeBrowser.storage.local.set({ categories: SAMPLE_CATEGORIES });
    const { initCategoriesStore, getRuleCategory } = await import('../../src/utils/categoriesStore');
    await initCategoriesStore();

    expect(getRuleCategory(null)).toBeNull();
    expect(getRuleCategory(undefined)).toBeNull();
    expect(getRuleCategory('')).toBeNull();
  });
});

describe('getCategoryLabel', () => {
  it('résout labelKey via getMessage pour les built-ins', async () => {
    const { getCategoryLabel } = await import('../../src/utils/categoriesStore');
    const cat: RuleCategory = { id: 'x', emoji: '✨', color: 'blue', labelKey: 'category_x', builtIn: true };

    expect(getCategoryLabel(cat)).toBe('i18n(category_x)');
  });

  it('utilise label en texte brut pour les customs', async () => {
    const { getCategoryLabel } = await import('../../src/utils/categoriesStore');
    const cat: RuleCategory = { id: 'x', emoji: '✨', color: 'blue', label: 'Custom Label', builtIn: false };

    expect(getCategoryLabel(cat)).toBe('Custom Label');
  });

  it('privilégie labelKey sur label quand les deux sont présents', async () => {
    const { getCategoryLabel } = await import('../../src/utils/categoriesStore');
    const cat: RuleCategory = {
      id: 'x',
      emoji: '✨',
      color: 'blue',
      labelKey: 'category_x',
      label: 'Fallback',
      builtIn: true,
    };

    expect(getCategoryLabel(cat)).toBe('i18n(category_x)');
  });
});

describe('fetchBuiltInCategories', () => {
  it('télécharge et valide le fichier categories.json', async () => {
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

  it('lève une erreur si la réponse HTTP est KO', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }),
    );
    const { fetchBuiltInCategories } = await import('../../src/utils/categoriesStore');

    await expect(fetchBuiltInCategories()).rejects.toThrow();
  });

  it('lève une erreur si le JSON ne respecte pas le schéma', async () => {
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
