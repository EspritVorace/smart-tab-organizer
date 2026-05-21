import builtInCategoriesFile from '@/data/categories.json';
import { categoriesFileSchema, type RuleCategory } from '@/schemas/category.js';
import { getActiveScopedItems } from './workspaceContext.js';
import { getMessage } from './i18n.js';
import { logger } from './logger.js';

let cache: RuleCategory[] = [];
let initialized = false;
let unwatch: (() => void) | null = null;

export async function initCategoriesStore(): Promise<void> {
  if (initialized) return;
  initialized = true;
  try {
    const { categoriesItem } = await getActiveScopedItems();
    cache = (await categoriesItem.getValue()) ?? [];
    unwatch = categoriesItem.watch((next) => {
      cache = next ?? [];
    });
  } catch (error) {
    logger.error('[CATEGORIES] Failed to read categories from storage:', error);
    cache = [];
  }
}

export function getAllCategories(): RuleCategory[] {
  return cache;
}

export function getRuleCategory(categoryId?: string | null): RuleCategory | null {
  if (!categoryId) return null;
  return cache.find(c => c.id === categoryId) ?? null;
}

export function getCategoryLabel(category: RuleCategory): string {
  if (category.labelKey) return getMessage(category.labelKey);
  return category.label ?? '';
}

export function getBuiltInCategories(): RuleCategory[] {
  return categoriesFileSchema.parse(builtInCategoriesFile).categories;
}

export function _resetCategoriesStoreForTests(): void {
  cache = [];
  initialized = false;
  if (unwatch) {
    unwatch();
    unwatch = null;
  }
}

export function _setCategoriesForTests(categories: RuleCategory[]): void {
  cache = categories;
  initialized = true;
}
