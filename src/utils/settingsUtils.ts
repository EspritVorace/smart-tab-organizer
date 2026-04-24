import { storage } from 'wxt/utils/storage';
import type { AppSettings } from '@/types/syncSettings.js';
import { defaultAppSettings } from '@/types/syncSettings.js';
import { logger } from './logger.js';
import {
  globalGroupingEnabledItem,
  globalDeduplicationEnabledItem,
  deduplicateUnmatchedDomainsItem,
  deduplicationKeepStrategyItem,
  domainRulesItem,
  categoriesItem,
  notifyOnGroupingItem,
  notifyOnDeduplicationItem,
  settingsItemMap,
} from './storageItems.js';

/**
 * Utilitaires pour les settings utilisables dans tous les contextes
 * (background, content scripts, popup, options)
 */

export async function getSettings(): Promise<AppSettings> {
  try {
    const results = await storage.getItems([
      globalGroupingEnabledItem,
      globalDeduplicationEnabledItem,
      deduplicateUnmatchedDomainsItem,
      deduplicationKeepStrategyItem,
      domainRulesItem,
      categoriesItem,
      notifyOnGroupingItem,
      notifyOnDeduplicationItem,
    ]);
    return {
      globalGroupingEnabled: results[0].value as boolean,
      globalDeduplicationEnabled: results[1].value as boolean,
      deduplicateUnmatchedDomains: results[2].value as boolean,
      deduplicationKeepStrategy: results[3].value as AppSettings['deduplicationKeepStrategy'],
      domainRules: results[4].value as AppSettings['domainRules'],
      categories: results[5].value as AppSettings['categories'],
      notifyOnGrouping: results[6].value as boolean,
      notifyOnDeduplication: results[7].value as boolean,
    };
  } catch (error) {
    logger.error('Error getting settings:', error);
    return defaultAppSettings;
  }
}

export async function setSettings(settings: AppSettings): Promise<void> {
  try {
    await storage.setItems([
      { item: globalGroupingEnabledItem, value: settings.globalGroupingEnabled },
      { item: globalDeduplicationEnabledItem, value: settings.globalDeduplicationEnabled },
      { item: deduplicateUnmatchedDomainsItem, value: settings.deduplicateUnmatchedDomains },
      { item: deduplicationKeepStrategyItem, value: settings.deduplicationKeepStrategy },
      { item: domainRulesItem, value: settings.domainRules },
      { item: categoriesItem, value: settings.categories },
      { item: notifyOnGroupingItem, value: settings.notifyOnGrouping },
      { item: notifyOnDeduplicationItem, value: settings.notifyOnDeduplication },
    ]);
  } catch (error) {
    logger.error('Error setting settings:', error);
  }
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<void> {
  try {
    const items: Parameters<typeof storage.setItems>[0] = [];
    if ('globalGroupingEnabled' in updates)
      items.push({ item: globalGroupingEnabledItem, value: updates.globalGroupingEnabled! });
    if ('globalDeduplicationEnabled' in updates)
      items.push({ item: globalDeduplicationEnabledItem, value: updates.globalDeduplicationEnabled! });
    if ('deduplicateUnmatchedDomains' in updates)
      items.push({ item: deduplicateUnmatchedDomainsItem, value: updates.deduplicateUnmatchedDomains! });
    if ('deduplicationKeepStrategy' in updates)
      items.push({ item: deduplicationKeepStrategyItem, value: updates.deduplicationKeepStrategy! });
    if ('domainRules' in updates)
      items.push({ item: domainRulesItem, value: updates.domainRules! });
    if ('categories' in updates)
      items.push({ item: categoriesItem, value: updates.categories! });
    if ('notifyOnGrouping' in updates)
      items.push({ item: notifyOnGroupingItem, value: updates.notifyOnGrouping! });
    if ('notifyOnDeduplication' in updates)
      items.push({ item: notifyOnDeduplicationItem, value: updates.notifyOnDeduplication! });
    if (items.length > 0) await storage.setItems(items);
  } catch (error) {
    logger.error('Error updating settings:', error);
  }
}


/**
 * Ecouter les changements de settings.
 * Retourne une fonction de cleanup.
 */
export function watchSettings(
  callback: (settings: AppSettings) => void,
): () => void {
  const unwatchers = [
    globalGroupingEnabledItem.watch(() => getSettings().then(callback)),
    globalDeduplicationEnabledItem.watch(() => getSettings().then(callback)),
    deduplicateUnmatchedDomainsItem.watch(() => getSettings().then(callback)),
    deduplicationKeepStrategyItem.watch(() => getSettings().then(callback)),
    domainRulesItem.watch(() => getSettings().then(callback)),
    categoriesItem.watch(() => getSettings().then(callback)),
    notifyOnGroupingItem.watch(() => getSettings().then(callback)),
    notifyOnDeduplicationItem.watch(() => getSettings().then(callback)),
  ];
  return () => unwatchers.forEach(u => u());
}

/**
 * Ecouter un champ spécifique des settings.
 */
export function watchSettingsField<K extends keyof AppSettings>(
  field: K,
  callback: (value: AppSettings[K]) => void,
): () => void {
  return (settingsItemMap[field] as unknown as { watch: (cb: (v: AppSettings[K]) => void) => () => void }).watch(
    (newValue: AppSettings[K]) => callback(newValue),
  );
}
