import { storage } from 'wxt/utils/storage';
import type { SyncSettings } from '../types/syncSettings.js';
import { defaultSyncSettings } from '../types/syncSettings.js';
import { logger } from './logger.js';
import {
  globalGroupingEnabledItem,
  globalDeduplicationEnabledItem,
  domainRulesItem,
  notifyOnGroupingItem,
  notifyOnDeduplicationItem,
  syncSettingsItemMap,
} from './storageItems.js';

/**
 * Utilitaires pour les settings utilisables dans tous les contextes
 * (background, content scripts, popup, options)
 */

export async function getSyncSettings(): Promise<SyncSettings> {
  try {
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
      domainRules: results[2].value as SyncSettings['domainRules'],
      notifyOnGrouping: results[3].value as boolean,
      notifyOnDeduplication: results[4].value as boolean,
    };
  } catch (error) {
    logger.error('Error getting sync settings:', error);
    return defaultSyncSettings;
  }
}

export async function setSyncSettings(settings: SyncSettings): Promise<void> {
  try {
    await storage.setItems([
      { item: globalGroupingEnabledItem, value: settings.globalGroupingEnabled },
      { item: globalDeduplicationEnabledItem, value: settings.globalDeduplicationEnabled },
      { item: domainRulesItem, value: settings.domainRules },
      { item: notifyOnGroupingItem, value: settings.notifyOnGrouping },
      { item: notifyOnDeduplicationItem, value: settings.notifyOnDeduplication },
    ]);
  } catch (error) {
    logger.error('Error setting sync settings:', error);
  }
}

export async function updateSyncSettings(updates: Partial<SyncSettings>): Promise<void> {
  try {
    const items: Parameters<typeof storage.setItems>[0] = [];
    if ('globalGroupingEnabled' in updates)
      items.push({ item: globalGroupingEnabledItem, value: updates.globalGroupingEnabled! });
    if ('globalDeduplicationEnabled' in updates)
      items.push({ item: globalDeduplicationEnabledItem, value: updates.globalDeduplicationEnabled! });
    if ('domainRules' in updates)
      items.push({ item: domainRulesItem, value: updates.domainRules! });
    if ('notifyOnGrouping' in updates)
      items.push({ item: notifyOnGroupingItem, value: updates.notifyOnGrouping! });
    if ('notifyOnDeduplication' in updates)
      items.push({ item: notifyOnDeduplicationItem, value: updates.notifyOnDeduplication! });
    if (items.length > 0) await storage.setItems(items);
  } catch (error) {
    logger.error('Error updating sync settings:', error);
  }
}

export async function getGlobalGroupingEnabled(): Promise<boolean> {
  try {
    return await globalGroupingEnabledItem.getValue();
  } catch (error) {
    logger.error('Error getting global grouping enabled:', error);
    return defaultSyncSettings.globalGroupingEnabled;
  }
}

export async function getGlobalDeduplicationEnabled(): Promise<boolean> {
  try {
    return await globalDeduplicationEnabledItem.getValue();
  } catch (error) {
    logger.error('Error getting global deduplication enabled:', error);
    return defaultSyncSettings.globalDeduplicationEnabled;
  }
}

export async function getDomainRules(): Promise<SyncSettings['domainRules']> {
  try {
    return await domainRulesItem.getValue();
  } catch (error) {
    logger.error('Error getting domain rules:', error);
    return defaultSyncSettings.domainRules;
  }
}

// getRegexPresets function removed - presets are now static in JSON file

/**
 * Écouter les changements de settings
 * Retourne une fonction de cleanup
 */
export function watchSyncSettings(
  callback: (settings: SyncSettings) => void,
): () => void {
  const unwatchers = [
    globalGroupingEnabledItem.watch(() => getSyncSettings().then(callback)),
    globalDeduplicationEnabledItem.watch(() => getSyncSettings().then(callback)),
    domainRulesItem.watch(() => getSyncSettings().then(callback)),
    notifyOnGroupingItem.watch(() => getSyncSettings().then(callback)),
    notifyOnDeduplicationItem.watch(() => getSyncSettings().then(callback)),
  ];
  return () => unwatchers.forEach(u => u());
}

/**
 * Écouter un champ spécifique des settings
 */
export function watchSyncSettingsField<K extends keyof SyncSettings>(
  field: K,
  callback: (value: SyncSettings[K]) => void,
): () => void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (syncSettingsItemMap[field] as any).watch(
    (newValue: SyncSettings[K]) => callback(newValue),
  );
}
