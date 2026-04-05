import { storage } from 'wxt/utils/storage';
import type { SyncSettings, DomainRuleSettings } from '../types/syncSettings.js';
import {
  globalGroupingEnabledItem,
  globalDeduplicationEnabledItem,
  domainRulesItem,
  notifyOnGroupingItem,
  notifyOnDeduplicationItem,
  syncSettingsItemMap,
} from '../utils/storageItems.js';
import { useSyncedState } from './useSyncedState.js';

export interface UseSyncedSettingsReturn {
  settings: SyncSettings | null;
  isLoaded: boolean;

  setGlobalGroupingEnabled: (value: boolean) => Promise<void>;
  setGlobalDeduplicationEnabled: (value: boolean) => Promise<void>;
  setDomainRules: (value: DomainRuleSettings) => Promise<void>;

  onGlobalGroupingEnabledChange: (callback: (value: boolean) => void) => () => void;
  onGlobalDeduplicationEnabledChange: (callback: (value: boolean) => void) => () => void;
  onDomainRulesChange: (callback: (value: DomainRuleSettings) => void) => () => void;

  updateSettings: (updates: Partial<SyncSettings>) => Promise<void>;
  reloadSettings: () => Promise<void>;
}

// --- Storage helpers (module-level, stable references) ---

async function loadSyncSettingsFromStorage(): Promise<SyncSettings> {
  const results = await storage.getItems([
    globalGroupingEnabledItem,
    globalDeduplicationEnabledItem,
    domainRulesItem,
    notifyOnGroupingItem,
    notifyOnDeduplicationItem,
  ]);
  return {
    globalGroupingEnabled: results[0].value as boolean,
    globalDeduplicationEnabled: results[1].value as boolean,
    domainRules: results[2].value as DomainRuleSettings,
    notifyOnGrouping: results[3].value as boolean,
    notifyOnDeduplication: results[4].value as boolean,
  };
}

/**
 * Register one watcher per storage item.
 * Each watcher fires `onChanged` with a single-field partial so the generic
 * hook can merge it into state and invoke per-field callbacks.
 */
function watchSyncSettings(onChanged: (update: Partial<SyncSettings>) => void): () => void {
  const unwatchers = (
    Object.entries(syncSettingsItemMap) as [keyof SyncSettings, { watch: (cb: (v: any) => void) => () => void }][]
  ).map(([field, item]) => item.watch((v) => onChanged({ [field]: v })));
  return () => unwatchers.forEach(u => u());
}

/**
 * Persist only the fields present in `updates` to their respective storage items.
 */
async function saveSettingsToStorage(updates: Partial<SyncSettings>): Promise<void> {
  const items = (Object.entries(updates) as [keyof typeof syncSettingsItemMap, any][])
    .filter(([key]) => key in syncSettingsItemMap)
    .map(([key, value]) => ({ item: syncSettingsItemMap[key], value }));
  if (items.length > 0) await storage.setItems(items);
}

// --- Hook ---

export function useSyncedSettings(): UseSyncedSettingsReturn {
  const { value: settings, isLoaded, update, onFieldChange, reload } =
    useSyncedState<SyncSettings>({
      load: loadSyncSettingsFromStorage,
      watch: watchSyncSettings,
      // Only save changed fields; `current` is not needed here.
      save: (updates) => saveSettingsToStorage(updates),
    });

  return {
    settings,
    isLoaded,

    setGlobalGroupingEnabled: (v) => update({ globalGroupingEnabled: v }),
    setGlobalDeduplicationEnabled: (v) => update({ globalDeduplicationEnabled: v }),
    setDomainRules: (v) => update({ domainRules: v }),

    onGlobalGroupingEnabledChange: (cb) => onFieldChange('globalGroupingEnabled', cb),
    onGlobalDeduplicationEnabledChange: (cb) => onFieldChange('globalDeduplicationEnabled', cb),
    onDomainRulesChange: (cb) => onFieldChange('domainRules', cb),

    updateSettings: update,
    reloadSettings: reload,
  };
}
