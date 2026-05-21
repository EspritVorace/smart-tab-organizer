import { browser } from 'wxt/browser';
import type {
  LocalizedString,
  PackManifest,
  PackParam,
  PackParamOption,
} from '@/schemas/pack';
import type { RuleCategory } from '@/schemas/category';
import { getRuleCategory, getCategoryLabel } from './categoriesStore';

function getUILocale(): string | null {
  try {
    return browser.i18n.getUILanguage() || null;
  } catch {
    return null;
  }
}

function pickFromRecord(
  record: Record<string, string>,
  locale: string | null,
): string | null {
  if (locale) {
    if (record[locale]) return record[locale];
    const base = locale.split('-')[0];
    if (base && record[base]) return record[base];
  }
  if (record.en) return record.en;
  const firstKey = Object.keys(record)[0];
  if (firstKey) return record[firstKey];
  return null;
}

/**
 * Resolve a `LocalizedString` to a plain string for the current UI locale.
 *
 * Resolution order: exact locale (e.g. `fr-FR`), language base (`fr`),
 * `en`, first record entry, finally `fallback`.
 */
export function resolveLocalized(
  value: LocalizedString | undefined,
  fallback = '',
): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object') {
    const picked = pickFromRecord(value, getUILocale());
    if (picked) return picked;
  }
  return fallback;
}

export function resolvePackName(pack: PackManifest): string {
  return resolveLocalized(pack.name, pack.id);
}

export function resolvePackDescription(pack: PackManifest): string {
  return resolveLocalized(pack.description, '');
}

export function resolvePackParamLabel(param: PackParam): string {
  return resolveLocalized(param.label, param.id);
}

export function resolvePackOptionLabel(option: PackParamOption): string {
  return resolveLocalized(option.label, option.value);
}

/**
 * Resolves a category label for either a `RuleCategory` (from the unified
 * source) or a `PackManifest` (either pointing to a unified category via
 * `categoryId`, or carrying a custom inline `category` localized string).
 */
export function resolvePackCategoryLabel(
  source: RuleCategory | PackManifest,
): string {
  if ('labelKey' in source || ('emoji' in source && 'builtIn' in source)) {
    return getCategoryLabel(source as RuleCategory);
  }
  const manifest = source as PackManifest;
  if (manifest.categoryId) {
    const cat = getRuleCategory(manifest.categoryId);
    if (cat) return getCategoryLabel(cat);
    return manifest.categoryId;
  }
  if (manifest.category !== undefined) {
    return resolveLocalized(manifest.category, '');
  }
  return '';
}
