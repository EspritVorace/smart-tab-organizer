import { browser } from 'wxt/browser';
import { getSyncSettings, setSyncSettings } from './settingsUtils.js';
import { logger } from './logger.js';
import { getStatisticsData, setStatisticsData } from './statisticsUtils.js';
import { defaultSyncSettings } from '@/types/syncSettings.js';
import { defaultStatistics } from '@/types/statistics.js';
import type { SyncSettings } from '@/types/syncSettings.js';

const defaultSettingsPath = '/data/default_settings.json' as const;
let cachedDefaultSettings: SyncSettings | null = null;

function isObject(item: any): item is Record<string, any> {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target: any, source: any): any {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        output[key] = key in target ? mergeDeep(target[key], source[key]) : source[key];
      } else {
        output[key] = source[key]; // Arrays & primitives: source wins
      }
    });
  }
  return output;
}

async function loadDefaultSettings(): Promise<SyncSettings> {
  if (cachedDefaultSettings) return cachedDefaultSettings;
  
  try {
    const url = browser.runtime.getURL(defaultSettingsPath);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Workspace err: ${response.statusText}`);
    cachedDefaultSettings = await response.json();
    return cachedDefaultSettings!;
  } catch (error) {
    logger.error("Cannot load defaults:", error);
    return defaultSyncSettings;
  }
}

export async function initializeDefaults(): Promise<void> {
  const defaults = await loadDefaultSettings();
  // WXT stores each setting as an individual key (e.g. 'domainRules'), not as a
  // single 'settings' object. Check for the presence of 'domainRules' to detect
  // whether the extension has been installed before.
  const rawSync = await browser.storage.sync.get('domainRules');

  if (rawSync.domainRules === undefined) {
    logger.debug("Init defaults from JSON...");
    await setSyncSettings(defaults);
  } else {
    logger.debug("Merging existing with JSON defaults...");
    const currentSettings = await getSyncSettings();
    const merged = mergeDeep(defaults, currentSettings);

    // Migrate missing fields on existing rules (never inject new default rules)
    if (merged.domainRules && Array.isArray(merged.domainRules)) {
      merged.domainRules.forEach((rule: any) => {
        if (typeof rule.label === 'undefined') {
          const defaultRule = defaults.domainRules.find(dr => dr.id === rule.id);
          rule.label = defaultRule ? defaultRule.label : rule.domainFilter || "Untitled Rule";
        }
        if (typeof rule.groupId !== 'undefined') {
          delete rule.groupId;
        }
        if (typeof rule.color === 'undefined') {
          rule.color = "grey";
        }
        if (typeof rule.urlParsingRegEx === 'undefined') {
          rule.urlParsingRegEx = '';
        }
        if (typeof rule.groupNameSource === 'undefined') {
          rule.groupNameSource = 'title';
        }
      });
    }
    await setSyncSettings(merged);
  }
  
  const localData = await browser.storage.local.get('statistics');
  if (!localData.statistics) {
    logger.debug("Init stats...");
    await setStatisticsData(defaultStatistics);
  }
}