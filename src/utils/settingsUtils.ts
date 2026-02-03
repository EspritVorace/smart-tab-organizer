import type { SyncSettings } from '../types/syncSettings.js';
import { defaultSyncSettings } from '../types/syncSettings.js';

/**
 * Utilitaires pour les settings utilisables dans tous les contextes
 * (background, content scripts, popup, options)
 */

export async function getSyncSettings(): Promise<SyncSettings> {
  try {
    const result = await browser.storage.sync.get(defaultSyncSettings);
    return result as SyncSettings;
  } catch (error) {
    console.error('Error getting sync settings:', error);
    return defaultSyncSettings;
  }
}

export async function setSyncSettings(settings: SyncSettings): Promise<void> {
  try {
    await browser.storage.sync.set(settings);
  } catch (error) {
    console.error('Error setting sync settings:', error);
  }
}

export async function updateSyncSettings(updates: Partial<SyncSettings>): Promise<void> {
  try {
    await browser.storage.sync.set(updates);
  } catch (error) {
    console.error('Error updating sync settings:', error);
  }
}

export async function getGlobalGroupingEnabled(): Promise<boolean> {
  try {
    const result = await browser.storage.sync.get({
      globalGroupingEnabled: defaultSyncSettings.globalGroupingEnabled
    });
    return result.globalGroupingEnabled;
  } catch (error) {
    console.error('Error getting global grouping enabled:', error);
    return defaultSyncSettings.globalGroupingEnabled;
  }
}

export async function getGlobalDeduplicationEnabled(): Promise<boolean> {
  try {
    const result = await browser.storage.sync.get({
      globalDeduplicationEnabled: defaultSyncSettings.globalDeduplicationEnabled
    });
    return result.globalDeduplicationEnabled;
  } catch (error) {
    console.error('Error getting global deduplication enabled:', error);
    return defaultSyncSettings.globalDeduplicationEnabled;
  }
}

export async function getDomainRules(): Promise<SyncSettings['domainRules']> {
  try {
    const result = await browser.storage.sync.get({
      domainRules: defaultSyncSettings.domainRules
    });
    return result.domainRules;
  } catch (error) {
    console.error('Error getting domain rules:', error);
    return defaultSyncSettings.domainRules;
  }
}


// getRegexPresets function removed - presets are now static in JSON file

/**
 * Écouter les changements de settings
 * Retourne une fonction de cleanup
 */
export function watchSyncSettings(
  callback: (settings: SyncSettings) => void
): () => void {
  const listener = (changes: any, areaName: string) => {
    if (areaName === 'sync') {
      // Reconstruction des settings à partir des changements
      getSyncSettings().then(callback);
    }
  };

  browser.storage.onChanged.addListener(listener);
  
  return () => {
    browser.storage.onChanged.removeListener(listener);
  };
}

/**
 * Écouter un champ spécifique des settings
 */
export function watchSyncSettingsField<K extends keyof SyncSettings>(
  field: K,
  callback: (value: SyncSettings[K]) => void
): () => void {
  const listener = (changes: any, areaName: string) => {
    if (areaName === 'sync' && changes[field]) {
      callback(changes[field].newValue);
    }
  };

  browser.storage.onChanged.addListener(listener);
  
  return () => {
    browser.storage.onChanged.removeListener(listener);
  };
}