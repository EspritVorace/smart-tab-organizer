import { browser } from 'wxt/browser';
import type { StorageItemKey } from 'wxt/utils/storage';
import { workspaceStorageKey, type WorkspaceScopedKey } from './workspaceStorage.js';
import { logger } from './logger.js';

const LOCAL_PREFIX = 'local:';

/**
 * Default `storage.local` quota in bytes (10 MB, Chrome MV3 default without
 * the `unlimitedStorage` permission). Used as a fallback when the runtime
 * does not expose `QUOTA_BYTES` (e.g. Firefox MV2).
 */
const DEFAULT_QUOTA_BYTES = 10_485_760;

const encoder = new TextEncoder();

/** Strips the WXT `local:` area prefix to get the raw `storage.local` key. */
function toRawKey(key: StorageItemKey): string {
  return key.startsWith(LOCAL_PREFIX) ? key.slice(LOCAL_PREFIX.length) : key;
}

/** Approximate UTF-8 byte size of a key/value pair (portable fallback). */
function encodeEntryBytes(rawKey: string, value: unknown): number {
  if (value === undefined) return 0;
  return encoder.encode(rawKey).length + encoder.encode(JSON.stringify(value)).length;
}

/**
 * Measures the bytes used by a set of WXT storage keys. Prefers the real
 * `getBytesInUse` API (the figure that counts against the quota); falls back
 * to encoding the stored values when the API is unavailable or throws.
 */
export async function measureKeysBytes(keys: StorageItemKey[]): Promise<number> {
  if (keys.length === 0) return 0;
  const rawKeys = keys.map(toRawKey);
  const local = browser.storage.local;

  if (typeof local.getBytesInUse === 'function') {
    try {
      return await local.getBytesInUse(rawKeys);
    } catch (error) {
      logger.debug('[STORAGE_USAGE] getBytesInUse(keys) failed, falling back:', error);
    }
  }

  const record = await local.get(rawKeys);
  return rawKeys.reduce(
    (sum, k) => sum + (k in record ? encodeEntryBytes(k, record[k]) : 0),
    0,
  );
}

/** Resolves the `storage.local` quota in bytes, with a portable fallback. */
export function getStorageQuotaBytes(): number {
  const quota = (browser.storage.local as { QUOTA_BYTES?: number }).QUOTA_BYTES;
  return typeof quota === 'number' && quota > 0 ? quota : DEFAULT_QUOTA_BYTES;
}

/** Measures the total bytes used by the whole `storage.local` area. */
export async function measureGlobalStorageUsage(): Promise<number> {
  const local = browser.storage.local;

  if (typeof local.getBytesInUse === 'function') {
    try {
      return await local.getBytesInUse(null);
    } catch (error) {
      logger.debug('[STORAGE_USAGE] getBytesInUse(null) failed, falling back:', error);
    }
  }

  const all = await local.get(null);
  return Object.entries(all).reduce((sum, [k, v]) => sum + encodeEntryBytes(k, v), 0);
}

export interface StorageCategoryUsage {
  id: string;
  labelKey: string;
  bytes: number;
}

export interface WorkspaceStorageUsage {
  categories: StorageCategoryUsage[];
  workspaceTotalBytes: number;
}

/** Small per-workspace flags/toggles grouped under the "settings" category. */
const SETTINGS_FIELDS: WorkspaceScopedKey[] = [
  'globalGroupingEnabled',
  'globalDeduplicationEnabled',
  'deduplicateUnmatchedDomains',
  'deduplicationKeepStrategy',
  'defaultRestoreAction',
  'notifyOnGrouping',
  'notifyOnDeduplication',
  'notifyOnOrganize',
  'popupPinnedEmptyCollapsed',
];

interface CategoryDescriptor {
  id: string;
  labelKey: string;
  keysFor: (wsId: string) => StorageItemKey[];
}

const CATEGORY_DESCRIPTORS: CategoryDescriptor[] = [
  {
    id: 'domain-rules',
    labelKey: 'statsStorageCatDomainRules',
    keysFor: (ws) => [workspaceStorageKey(ws, 'domainRules')],
  },
  {
    id: 'sessions-active',
    labelKey: 'statsStorageCatSessionsActive',
    keysFor: (ws) => [workspaceStorageKey(ws, 'sessions')],
  },
  {
    id: 'sessions-pinned',
    labelKey: 'statsStorageCatSessionsPinned',
    keysFor: (ws) => [workspaceStorageKey(ws, 'pinnedSessions')],
  },
  {
    id: 'sessions-archived',
    labelKey: 'statsStorageCatSessionsArchived',
    keysFor: (ws) => [workspaceStorageKey(ws, 'archivedSessions')],
  },
  {
    id: 'statistics',
    labelKey: 'statsStorageCatStatistics',
    keysFor: (ws) => [workspaceStorageKey(ws, 'statistics')],
  },
  {
    // Rule categories are global (shared across workspaces), stored at the
    // unprefixed legacy key.
    id: 'categories',
    labelKey: 'statsStorageCatCategories',
    keysFor: () => ['local:categories' as StorageItemKey],
  },
  {
    id: 'settings',
    labelKey: 'statsStorageCatSettings',
    keysFor: (ws) => SETTINGS_FIELDS.map((field) => workspaceStorageKey(ws, field)),
  },
];

/**
 * Measures `storage.local` usage broken down by data category for a given
 * workspace. Categories with a measurable size are returned alongside the
 * summed workspace total.
 */
export async function measureWorkspaceStorageUsage(
  wsId: string,
): Promise<WorkspaceStorageUsage> {
  const categories = await Promise.all(
    CATEGORY_DESCRIPTORS.map(async (desc) => ({
      id: desc.id,
      labelKey: desc.labelKey,
      bytes: await measureKeysBytes(desc.keysFor(wsId)),
    })),
  );

  const workspaceTotalBytes = categories.reduce((sum, c) => sum + c.bytes, 0);
  return { categories, workspaceTotalBytes };
}
