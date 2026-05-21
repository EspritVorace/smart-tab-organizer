import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import type { RuleCategory } from '../../src/schemas/category';

beforeEach(() => {
  fakeBrowser.reset();
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('seedBuiltInCategories', () => {
  it('seeds the 14 unified built-ins from the static JSON when storage is empty', async () => {
    const { seedBuiltInCategories } = await import('../../src/background/migration');

    await seedBuiltInCategories();

    const { categories, categoriesSeeded } = await fakeBrowser.storage.local.get([
      'categories', 'categoriesSeeded',
    ]);
    expect((categories as RuleCategory[]).length).toBe(14);
    const ids = (categories as RuleCategory[]).map((c) => c.id);
    expect(ids).toContain('generic');
    expect(ids).toContain('communication');
    expect(ids).toContain('news');
    expect(ids).toContain('ai');
    expect(categoriesSeeded).toBe(true);
  });

  it('does not overwrite categories already present in storage', async () => {
    const existing: RuleCategory[] = [
      { id: 'gaming', emoji: '🎮', label: 'Gaming', builtIn: false },
    ];
    await fakeBrowser.storage.local.set({ categories: existing });

    const { seedBuiltInCategories } = await import('../../src/background/migration');
    await seedBuiltInCategories();

    const { categories, categoriesSeeded } = await fakeBrowser.storage.local.get([
      'categories', 'categoriesSeeded',
    ]);
    expect(categories).toEqual(existing);
    expect(categoriesSeeded).toBe(true);
  });

  it('is idempotent: does nothing when the categoriesSeeded flag is already set', async () => {
    await fakeBrowser.storage.local.set({ categoriesSeeded: true });

    const { seedBuiltInCategories } = await import('../../src/background/migration');
    await seedBuiltInCategories();

    const { categories } = await fakeBrowser.storage.local.get('categories');
    expect(categories).toBeUndefined();
  });
});

describe('seedUnifiedCategories', () => {
  it('appends the new unified built-ins to an existing legacy set of categories', async () => {
    const legacyTenBuiltIns: RuleCategory[] = [
      { id: 'development', emoji: '💻', labelKey: 'category_development', builtIn: true },
      { id: 'productivity', emoji: '📋', labelKey: 'category_productivity', builtIn: true },
      { id: 'commerce', emoji: '🛍️', labelKey: 'category_commerce', builtIn: true },
      { id: 'travel', emoji: '✈️', labelKey: 'category_travel', builtIn: true },
      { id: 'search', emoji: '🔍', labelKey: 'category_search', builtIn: true },
      { id: 'social', emoji: '💬', labelKey: 'category_social', builtIn: true },
      { id: 'media', emoji: '🎬', labelKey: 'category_media', builtIn: true },
      { id: 'cloud', emoji: '☁️', labelKey: 'category_cloud', builtIn: true },
      { id: 'finance', emoji: '💰', labelKey: 'category_finance', builtIn: true },
      { id: 'education', emoji: '🎓', labelKey: 'category_education', builtIn: true },
    ];
    await fakeBrowser.storage.local.set({ categories: legacyTenBuiltIns });

    const { seedUnifiedCategories } = await import('../../src/background/migration');
    await seedUnifiedCategories();

    const { categories, unifiedCategoriesSeeded } = await fakeBrowser.storage.local.get([
      'categories', 'unifiedCategoriesSeeded',
    ]);
    const stored = categories as RuleCategory[];
    expect(stored.length).toBe(14);
    const ids = stored.map((c) => c.id);
    expect(ids.slice(0, 10)).toEqual(legacyTenBuiltIns.map((c) => c.id));
    for (const newId of ['generic', 'communication', 'news', 'ai']) {
      expect(ids).toContain(newId);
    }
    expect(unifiedCategoriesSeeded).toBe(true);
  });

  it('preserves user-customized categories and only appends missing built-ins', async () => {
    const userCategories: RuleCategory[] = [
      { id: 'development', emoji: '💻', labelKey: 'category_development', builtIn: true },
      { id: 'gaming', emoji: '🎮', label: 'Gaming', builtIn: false },
    ];
    await fakeBrowser.storage.local.set({ categories: userCategories });

    const { seedUnifiedCategories } = await import('../../src/background/migration');
    await seedUnifiedCategories();

    const { categories } = await fakeBrowser.storage.local.get('categories');
    const stored = categories as RuleCategory[];
    expect(stored[0]).toEqual(userCategories[0]);
    expect(stored[1]).toEqual(userCategories[1]);
    const ids = stored.map((c) => c.id);
    for (const newId of ['generic', 'communication', 'news', 'ai']) {
      expect(ids).toContain(newId);
    }
  });

  it('is idempotent: a second call with the flag set does not modify storage', async () => {
    const initial: RuleCategory[] = [
      { id: 'development', emoji: '💻', labelKey: 'category_development', builtIn: true },
    ];
    await fakeBrowser.storage.local.set({
      categories: initial,
      unifiedCategoriesSeeded: true,
    });

    const { seedUnifiedCategories } = await import('../../src/background/migration');
    await seedUnifiedCategories();

    const { categories } = await fakeBrowser.storage.local.get('categories');
    expect(categories).toEqual(initial);
  });

  it('skips the append when storage is empty (initial seed will handle it) but marks the flag', async () => {
    const { seedUnifiedCategories } = await import('../../src/background/migration');
    await seedUnifiedCategories();

    const { categories, unifiedCategoriesSeeded } = await fakeBrowser.storage.local.get([
      'categories', 'unifiedCategoriesSeeded',
    ]);
    expect(categories).toBeUndefined();
    expect(unifiedCategoriesSeeded).toBe(true);
  });
});
