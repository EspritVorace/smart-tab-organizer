import { browser } from 'wxt/browser';
import type {
  LocalizedString,
  PackCategory,
  PackManifest,
  PackParam,
  PackParamOption,
} from '@/schemas/pack';

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

export function resolvePackCategoryLabel(
  source: PackCategory | PackManifest,
): string {
  if ('label' in source && source.label !== undefined) {
    return resolveLocalized(source.label, source.id);
  }
  if ('category' in source && source.category !== undefined) {
    return resolveLocalized(source.category, '');
  }
  return '';
}
