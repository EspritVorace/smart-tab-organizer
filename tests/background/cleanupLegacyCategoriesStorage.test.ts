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

describe('cleanupLegacyCategoriesStorage', () => {
  it('removes the legacy category keys and sets the cleanup flag', async () => {
    const legacyCategories: RuleCategory[] = [
      { id: 'development', emoji: '💻', labelKey: 'category_development', builtIn: true },
    ];
    await fakeBrowser.storage.local.set({
      categories: legacyCategories,
      categoriesSeeded: true,
      unifiedCategoriesSeeded: true,
    });

    const { cleanupLegacyCategoriesStorage } = await import('../../src/background/migration');
    await cleanupLegacyCategoriesStorage();

    const stored = await fakeBrowser.storage.local.get([
      'categories', 'categoriesSeeded', 'unifiedCategoriesSeeded', 'legacyCategoriesCleaned',
    ]);
    expect(stored.categories).toBeUndefined();
    expect(stored.categoriesSeeded).toBeUndefined();
    expect(stored.unifiedCategoriesSeeded).toBeUndefined();
    expect(stored.legacyCategoriesCleaned).toBe(true);
  });

  it('is a no-op on a fresh install (no legacy keys) but still marks the flag', async () => {
    const { cleanupLegacyCategoriesStorage } = await import('../../src/background/migration');
    await cleanupLegacyCategoriesStorage();

    const stored = await fakeBrowser.storage.local.get(['categories', 'legacyCategoriesCleaned']);
    expect(stored.categories).toBeUndefined();
    expect(stored.legacyCategoriesCleaned).toBe(true);
  });

  it('is idempotent: skips the removal when the flag is already set', async () => {
    const stale: RuleCategory[] = [{ id: 'x', emoji: '✨', label: 'X', builtIn: false }];
    await fakeBrowser.storage.local.set({
      categories: stale,
      legacyCategoriesCleaned: true,
    });

    const { cleanupLegacyCategoriesStorage } = await import('../../src/background/migration');
    await cleanupLegacyCategoriesStorage();

    // The guard short-circuits before the remove, so the stale value remains.
    const stored = await fakeBrowser.storage.local.get('categories');
    expect(stored.categories).toEqual(stale);
  });
});
