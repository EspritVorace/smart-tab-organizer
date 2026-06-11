import { getMessage, type MessageKey } from './i18n.js';

const KB = 1024;
const MB = KB * 1024;

/**
 * Formats a byte count into a localized, human-readable string.
 *
 * Units are locale-dependent (FR: o/Ko/Mo, EN/ES: B/KB/MB), so the unit
 * label is resolved via `getMessage()` rather than hardcoded. The numeric
 * part is rendered with at most one decimal beyond the kilobyte threshold,
 * trailing `.0` removed.
 */
export function formatBytes(bytes: number): string {
  const safe = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;

  if (safe < KB) {
    return getMessage('statsStorageUnitBytes').replace('{value}', String(Math.round(safe)));
  }

  const [value, key]: [number, MessageKey] =
    safe < MB ? [safe / KB, 'statsStorageUnitKb'] : [safe / MB, 'statsStorageUnitMb'];

  const rounded = value.toFixed(1).replace(/\.0$/, '');
  return getMessage(key).replace('{value}', rounded);
}
