import { useMemo } from 'react';
import {
  packCategoriesFileSchema,
  packFileSchema,
  type PackCategory,
  type PackFile,
} from '@/schemas/pack';
import { logger } from '@/utils/logger';
import { resolvePackName, resolvePackCategoryLabel } from '@/utils/packLabel';
import { getCategoriesSource, getPackSourceEntries } from './packDataSource';

export interface UsePacksResult {
  packs: PackFile[];
  categories: PackCategory[];
  loadError: string | null;
}

interface PreparedData {
  packs: PackFile[];
  categories: PackCategory[];
  loadError: string | null;
}

function prepare(): PreparedData {
  const categoriesParsed = packCategoriesFileSchema.safeParse(getCategoriesSource());
  let categories: PackCategory[] = [];
  let loadError: string | null = null;

  if (categoriesParsed.success) {
    categories = categoriesParsed.data.categories;
  } else {
    loadError = `Pack categories file is invalid: ${categoriesParsed.error.message}`;
    logger.warn('[usePacks]', loadError);
  }

  const knownCategoryIds = new Set(categories.map((c) => c.id));
  const categoryOrder = new Map(categories.map((c, index) => [c.id, index]));

  const validPacks: PackFile[] = [];
  for (const entry of getPackSourceEntries()) {
    const parsed = packFileSchema.safeParse(entry.data);
    if (!parsed.success) {
      logger.warn(
        `[usePacks] pack file ${entry.path} is invalid:`,
        parsed.error.message,
      );
      continue;
    }
    const pack = parsed.data;
    if (pack.pack.categoryId && !knownCategoryIds.has(pack.pack.categoryId)) {
      logger.warn(
        `[usePacks] pack ${pack.pack.id} references unknown categoryId ${pack.pack.categoryId}, skipping.`,
      );
      continue;
    }
    validPacks.push(pack);
  }

  validPacks.sort((a, b) => {
    const aOrder = a.pack.categoryId
      ? (categoryOrder.get(a.pack.categoryId) ?? Number.MAX_SAFE_INTEGER)
      : Number.MAX_SAFE_INTEGER;
    const bOrder = b.pack.categoryId
      ? (categoryOrder.get(b.pack.categoryId) ?? Number.MAX_SAFE_INTEGER)
      : Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    const aLabel = resolvePackCategoryLabel(a.pack);
    const bLabel = resolvePackCategoryLabel(b.pack);
    if (aLabel !== bLabel) return aLabel.localeCompare(bLabel);
    return resolvePackName(a.pack).localeCompare(resolvePackName(b.pack));
  });

  return { packs: validPacks, categories, loadError };
}

export function usePacks(): UsePacksResult {
  return useMemo(() => prepare(), []);
}
