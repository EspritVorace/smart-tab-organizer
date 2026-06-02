import { storage } from 'wxt/utils/storage';
import type { AppSettings } from '@/types/syncSettings.js';
import { defaultAppSettings } from '@/types/syncSettings.js';
import { logger } from './logger.js';
import { getActiveScopedItems, getActiveScopedItemsSync } from './workspaceContext.js';

/**
 * Settings utilities usable from all contexts (background, content scripts,
 * popup, options).
 *
 * All accesses go through `getActiveScopedItems()` to target the active
 * workspace. Without explicit initialization (e.g. in unit tests), items
 * resolve to the default workspace, which reuses the legacy unprefixed keys.
 */

export async function getSettings(): Promise<AppSettings> {
  try {
    const items = await getActiveScopedItems();
    const results = await storage.getItems([
      items.globalGroupingEnabledItem,
      items.globalDeduplicationEnabledItem,
      items.deduplicateUnmatchedDomainsItem,
      items.deduplicationKeepStrategyItem,
      items.defaultRestoreActionItem,
      items.domainRulesItem,
      items.notifyOnGroupingItem,
      items.notifyOnDeduplicationItem,
      items.notifyOnOrganizeItem,
    ]);
    return {
      globalGroupingEnabled: results[0].value as boolean,
      globalDeduplicationEnabled: results[1].value as boolean,
      deduplicateUnmatchedDomains: results[2].value as boolean,
      deduplicationKeepStrategy: results[3].value as AppSettings['deduplicationKeepStrategy'],
      defaultRestoreAction: results[4].value as AppSettings['defaultRestoreAction'],
      domainRules: results[5].value as AppSettings['domainRules'],
      notifyOnGrouping: results[6].value as boolean,
      notifyOnDeduplication: results[7].value as boolean,
      notifyOnOrganize: results[8].value as boolean,
    };
  } catch (error) {
    logger.error('Error getting settings:', error);
    return defaultAppSettings;
  }
}

export async function setSettings(settings: AppSettings): Promise<void> {
  try {
    const items = await getActiveScopedItems();
    await storage.setItems([
      { item: items.globalGroupingEnabledItem, value: settings.globalGroupingEnabled },
      { item: items.globalDeduplicationEnabledItem, value: settings.globalDeduplicationEnabled },
      { item: items.deduplicateUnmatchedDomainsItem, value: settings.deduplicateUnmatchedDomains },
      { item: items.deduplicationKeepStrategyItem, value: settings.deduplicationKeepStrategy },
      { item: items.defaultRestoreActionItem, value: settings.defaultRestoreAction },
      { item: items.domainRulesItem, value: settings.domainRules },
      { item: items.notifyOnGroupingItem, value: settings.notifyOnGrouping },
      { item: items.notifyOnDeduplicationItem, value: settings.notifyOnDeduplication },
      { item: items.notifyOnOrganizeItem, value: settings.notifyOnOrganize },
    ]);
  } catch (error) {
    logger.error('Error setting settings:', error);
  }
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<void> {
  try {
    const items = await getActiveScopedItems();
    const writes: Parameters<typeof storage.setItems>[0] = [];
    if ('globalGroupingEnabled' in updates)
      writes.push({ item: items.globalGroupingEnabledItem, value: updates.globalGroupingEnabled! });
    if ('globalDeduplicationEnabled' in updates)
      writes.push({ item: items.globalDeduplicationEnabledItem, value: updates.globalDeduplicationEnabled! });
    if ('deduplicateUnmatchedDomains' in updates)
      writes.push({ item: items.deduplicateUnmatchedDomainsItem, value: updates.deduplicateUnmatchedDomains! });
    if ('deduplicationKeepStrategy' in updates)
      writes.push({ item: items.deduplicationKeepStrategyItem, value: updates.deduplicationKeepStrategy! });
    if ('defaultRestoreAction' in updates)
      writes.push({ item: items.defaultRestoreActionItem, value: updates.defaultRestoreAction! });
    if ('domainRules' in updates)
      writes.push({ item: items.domainRulesItem, value: updates.domainRules! });
    if ('notifyOnGrouping' in updates)
      writes.push({ item: items.notifyOnGroupingItem, value: updates.notifyOnGrouping! });
    if ('notifyOnDeduplication' in updates)
      writes.push({ item: items.notifyOnDeduplicationItem, value: updates.notifyOnDeduplication! });
    if ('notifyOnOrganize' in updates)
      writes.push({ item: items.notifyOnOrganizeItem, value: updates.notifyOnOrganize! });
    if (writes.length > 0) await storage.setItems(writes);
  } catch (error) {
    logger.error('Error updating settings:', error);
  }
}

/**
 * Listen to settings changes for the currently active workspace at the time
 * the watcher is installed. Switching workspace requires re-subscribing.
 */
export function watchSettings(
  callback: (settings: AppSettings) => void,
): () => void {
  const items = getActiveScopedItemsSync();
  const unwatchers = [
    items.globalGroupingEnabledItem.watch(() => getSettings().then(callback)),
    items.globalDeduplicationEnabledItem.watch(() => getSettings().then(callback)),
    items.deduplicateUnmatchedDomainsItem.watch(() => getSettings().then(callback)),
    items.deduplicationKeepStrategyItem.watch(() => getSettings().then(callback)),
    items.defaultRestoreActionItem.watch(() => getSettings().then(callback)),
    items.domainRulesItem.watch(() => getSettings().then(callback)),
    items.notifyOnGroupingItem.watch(() => getSettings().then(callback)),
    items.notifyOnDeduplicationItem.watch(() => getSettings().then(callback)),
    items.notifyOnOrganizeItem.watch(() => getSettings().then(callback)),
  ];
  return () => unwatchers.forEach(u => u());
}

export function watchSettingsField<K extends keyof AppSettings>(
  field: K,
  callback: (value: AppSettings[K]) => void,
): () => void {
  const items = getActiveScopedItemsSync();
  const fieldToItem: Record<keyof AppSettings, { watch: (cb: (v: unknown) => void) => () => void }> = {
    globalGroupingEnabled: items.globalGroupingEnabledItem,
    globalDeduplicationEnabled: items.globalDeduplicationEnabledItem,
    deduplicateUnmatchedDomains: items.deduplicateUnmatchedDomainsItem,
    deduplicationKeepStrategy: items.deduplicationKeepStrategyItem,
    defaultRestoreAction: items.defaultRestoreActionItem,
    domainRules: items.domainRulesItem,
    notifyOnGrouping: items.notifyOnGroupingItem,
    notifyOnDeduplication: items.notifyOnDeduplicationItem,
    notifyOnOrganize: items.notifyOnOrganizeItem,
  };
  return fieldToItem[field].watch((newValue) => callback(newValue as AppSettings[K]));
}
