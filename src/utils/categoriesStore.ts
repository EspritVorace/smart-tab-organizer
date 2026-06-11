import builtInCategoriesFile from '@/data/categories.json';
import { categoriesFileSchema, type RuleCategory } from '@/schemas/category.js';
import { getMessage, type MessageKey } from './i18n.js';

/**
 * Rule categories are read-only constants sourced from
 * `src/data/categories.json` (the single source of truth). They are loaded
 * synchronously into memory at module load, like regex presets, and are never
 * stored in `browser.storage.local`.
 */
let cache: RuleCategory[] = categoriesFileSchema.parse(builtInCategoriesFile).categories;

export function getAllCategories(): RuleCategory[] {
  return cache;
}

export function getRuleCategory(categoryId?: string | null): RuleCategory | null {
  if (!categoryId) return null;
  return cache.find(c => c.id === categoryId) ?? null;
}

export function getCategoryLabel(category: RuleCategory): string {
  if (category.labelKey) return getMessage(category.labelKey as MessageKey);
  return category.label ?? '';
}

export function _resetCategoriesStoreForTests(): void {
  cache = categoriesFileSchema.parse(builtInCategoriesFile).categories;
}

export function _setCategoriesForTests(categories: RuleCategory[]): void {
  cache = categories;
}
