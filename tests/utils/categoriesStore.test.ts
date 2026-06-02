import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { RuleCategory } from '../../src/schemas/category';

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => `i18n(${key})`),
}));

beforeEach(() => {
  vi.resetModules();
});

describe('getAllCategories', () => {
  it('returns the 14 unified built-in categories from src/data/categories.json', async () => {
    const { getAllCategories } = await import('../../src/utils/categoriesStore');

    const result = getAllCategories();

    expect(result.length).toBe(14);
    const ids = result.map((c) => c.id);
    for (const expected of [
      'development', 'productivity', 'commerce', 'travel', 'search', 'social',
      'media', 'cloud', 'finance', 'education', 'generic', 'communication',
      'news', 'ai',
    ]) {
      expect(ids).toContain(expected);
    }
    for (const c of result) {
      expect(c.builtIn).toBe(true);
      expect(c.labelKey).toBeTruthy();
      expect(c.emoji).toBeTruthy();
    }
  });

  it('is available synchronously without any initialization', async () => {
    const { getAllCategories } = await import('../../src/utils/categoriesStore');
    expect(getAllCategories().length).toBe(14);
  });
});

describe('getRuleCategory', () => {
  it('returns the category matching the id', async () => {
    const { getRuleCategory } = await import('../../src/utils/categoriesStore');

    const cat = getRuleCategory('development');
    expect(cat?.id).toBe('development');
    expect(cat?.emoji).toBe('💻');
  });

  it('returns null for an unknown id', async () => {
    const { getRuleCategory } = await import('../../src/utils/categoriesStore');
    expect(getRuleCategory('unknown')).toBeNull();
  });

  it('returns null for null/undefined/empty string', async () => {
    const { getRuleCategory } = await import('../../src/utils/categoriesStore');
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

describe('test helpers', () => {
  it('_setCategoriesForTests overrides the cache and _resetCategoriesStoreForTests restores the built-ins', async () => {
    const {
      getAllCategories,
      _setCategoriesForTests,
      _resetCategoriesStoreForTests,
    } = await import('../../src/utils/categoriesStore');

    const custom: RuleCategory[] = [
      { id: 'gaming', emoji: '🎮', label: 'Gaming', builtIn: false },
    ];
    _setCategoriesForTests(custom);
    expect(getAllCategories()).toHaveLength(1);
    expect(getAllCategories()[0].id).toBe('gaming');

    _resetCategoriesStoreForTests();
    expect(getAllCategories()).toHaveLength(14);
  });
});
