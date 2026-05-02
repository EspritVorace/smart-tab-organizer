import { useCallback, useMemo } from 'react';
import { storage } from 'wxt/utils/storage';
import type { AppSettings, DomainRuleSettings } from '@/types/syncSettings.js';
import type { DeduplicationKeepStrategyValue } from '@/schemas/enums.js';
import type { RuleCategory } from '@/schemas/category.js';
import type { ScopedItems } from '@/utils/workspaceStorage.js';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext.js';
import { useStorageState } from './useStorageState.js';

export interface UseSettingsReturn {
  settings: AppSettings | null;
  isLoaded: boolean;

  setGlobalGroupingEnabled: (value: boolean) => Promise<void>;
  setGlobalDeduplicationEnabled: (value: boolean) => Promise<void>;
  setDeduplicateUnmatchedDomains: (value: boolean) => Promise<void>;
  setDeduplicationKeepStrategy: (value: DeduplicationKeepStrategyValue) => Promise<void>;
  setDomainRules: (value: DomainRuleSettings) => Promise<void>;
  setCategories: (value: RuleCategory[]) => Promise<void>;

  onGlobalGroupingEnabledChange: (callback: (value: boolean) => void) => () => void;
  onGlobalDeduplicationEnabledChange: (callback: (value: boolean) => void) => () => void;
  onDeduplicateUnmatchedDomainsChange: (callback: (value: boolean) => void) => () => void;
  onDeduplicationKeepStrategyChange: (
    callback: (value: DeduplicationKeepStrategyValue) => void,
  ) => () => void;
  onDomainRulesChange: (callback: (value: DomainRuleSettings) => void) => () => void;
  onCategoriesChange: (callback: (value: RuleCategory[]) => void) => () => void;

  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  reloadSettings: () => Promise<void>;
}

type SettingsItemMap = {
  [K in keyof AppSettings]: { watch: (cb: (v: AppSettings[K]) => void) => () => void };
};

function buildSettingsItemMap(items: ScopedItems): SettingsItemMap {
  return {
    globalGroupingEnabled: items.globalGroupingEnabledItem,
    globalDeduplicationEnabled: items.globalDeduplicationEnabledItem,
    deduplicateUnmatchedDomains: items.deduplicateUnmatchedDomainsItem,
    deduplicationKeepStrategy: items.deduplicationKeepStrategyItem,
    domainRules: items.domainRulesItem,
    categories: items.categoriesItem,
    notifyOnGrouping: items.notifyOnGroupingItem,
    notifyOnDeduplication: items.notifyOnDeduplicationItem,
  } as SettingsItemMap;
}

async function loadSettingsFromStorage(items: ScopedItems): Promise<AppSettings> {
  const results = await storage.getItems([
    items.globalGroupingEnabledItem,
    items.globalDeduplicationEnabledItem,
    items.deduplicateUnmatchedDomainsItem,
    items.deduplicationKeepStrategyItem,
    items.domainRulesItem,
    items.categoriesItem,
    items.notifyOnGroupingItem,
    items.notifyOnDeduplicationItem,
  ]);

  const rawRules = results[4].value as DomainRuleSettings;
  // Migrate legacy wildcard syntax: *.example.com -> example.com
  const hasWildcards = rawRules?.some(r => r.domainFilter?.startsWith('*.'));
  const domainRules = hasWildcards
    ? rawRules.map(r => ({
        ...r,
        domainFilter: r.domainFilter?.startsWith('*.') ? r.domainFilter.slice(2) : r.domainFilter,
      }))
    : rawRules;
  if (hasWildcards) {
    await storage.setItems([{ item: items.domainRulesItem, value: domainRules }]);
  }

  return {
    globalGroupingEnabled: results[0].value as boolean,
    globalDeduplicationEnabled: results[1].value as boolean,
    deduplicateUnmatchedDomains: results[2].value as boolean,
    deduplicationKeepStrategy: results[3].value as DeduplicationKeepStrategyValue,
    domainRules,
    categories: results[5].value as RuleCategory[],
    notifyOnGrouping: results[6].value as boolean,
    notifyOnDeduplication: results[7].value as boolean,
  };
}

function watchAppSettings(
  settingsItemMap: SettingsItemMap,
  onChanged: (update: Partial<AppSettings>) => void,
): () => void {
  const unwatchers = (
    Object.entries(settingsItemMap) as [keyof AppSettings, { watch: (cb: (v: unknown) => void) => () => void }][]
  ).map(([field, item]) => item.watch((v) => onChanged({ [field]: v })));
  return () => unwatchers.forEach(u => u());
}

async function saveSettingsToStorage(
  settingsItemMap: SettingsItemMap,
  updates: Partial<AppSettings>,
): Promise<void> {
  const items = (Object.entries(updates) as [keyof AppSettings, AppSettings[keyof AppSettings]][])
    .filter(([key]) => key in settingsItemMap)
    .map(([key, value]) => ({ item: settingsItemMap[key] as never, value }));
  if (items.length > 0) await storage.setItems(items);
}

export function useSettings(): UseSettingsReturn {
  const { scopedItems } = useActiveWorkspaceContext();
  const settingsItemMap = useMemo(() => buildSettingsItemMap(scopedItems), [scopedItems]);

  const load = useCallback(() => loadSettingsFromStorage(scopedItems), [scopedItems]);
  const watch = useCallback(
    (onChanged: (u: Partial<AppSettings>) => void) => watchAppSettings(settingsItemMap, onChanged),
    [settingsItemMap],
  );
  const save = useCallback(
    (updates: Partial<AppSettings>) => saveSettingsToStorage(settingsItemMap, updates),
    [settingsItemMap],
  );

  const { value: settings, isLoaded, update, onFieldChange, reload } =
    useStorageState<AppSettings>({ load, watch, save });

  return {
    settings,
    isLoaded,

    setGlobalGroupingEnabled: (v) => update({ globalGroupingEnabled: v }),
    setGlobalDeduplicationEnabled: (v) => update({ globalDeduplicationEnabled: v }),
    setDeduplicateUnmatchedDomains: (v) => update({ deduplicateUnmatchedDomains: v }),
    setDeduplicationKeepStrategy: (v) => update({ deduplicationKeepStrategy: v }),
    setDomainRules: (v) => update({ domainRules: v }),
    setCategories: (v) => update({ categories: v }),

    onGlobalGroupingEnabledChange: (cb) => onFieldChange('globalGroupingEnabled', cb),
    onGlobalDeduplicationEnabledChange: (cb) => onFieldChange('globalDeduplicationEnabled', cb),
    onDeduplicateUnmatchedDomainsChange: (cb) => onFieldChange('deduplicateUnmatchedDomains', cb),
    onDeduplicationKeepStrategyChange: (cb) => onFieldChange('deduplicationKeepStrategy', cb),
    onDomainRulesChange: (cb) => onFieldChange('domainRules', cb),
    onCategoriesChange: (cb) => onFieldChange('categories', cb),

    updateSettings: update,
    reloadSettings: reload,
  };
}
