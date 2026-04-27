import { categoriesFileSchema, type RuleCategory } from '@/schemas/category.js';
import { categoriesItem } from './storageItems.js';
import { getMessage } from './i18n.js';
import { logger } from './logger.js';

let cache: RuleCategory[] = [];
let initialized = false;
let unwatch: (() => void) | null = null;

export async function initCategoriesStore(): Promise<void> {
  if (initialized) return;
  initialized = true;
  try {
    cache = (await categoriesItem.getValue()) ?? [];
  } catch (error) {
    logger.error('[CATEGORIES] Failed to read categories from storage:', error);
    cache = [];
  }
  unwatch = categoriesItem.watch((next) => {
    cache = next ?? [];
  });
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

export async function fetchBuiltInCategories(): Promise<RuleCategory[]> {
  const response = await fetch('/data/categories.json');
  if (!response.ok) {
    throw new Error(`Failed to load categories: ${response.status}`);
  }
  const data = await response.json();
  const parsed = categoriesFileSchema.parse(data);
  return parsed.categories;
}

export function _resetCategoriesStoreForTests(): void {
  cache = [];
  initialized = false;
  if (unwatch) {
    unwatch();
    unwatch = null;
  }
}
