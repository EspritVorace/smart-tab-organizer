import { browser } from 'wxt/browser';
import { getSettings, setSettings } from './settingsUtils.js';
import { logger } from './logger.js';
import { setStatisticsData } from './statisticsUtils.js';
import { defaultAppSettings } from '@/types/syncSettings.js';
import { defaultStatistics } from '@/types/statistics.js';
import type { AppSettings, DomainRuleSetting } from '@/types/syncSettings.js';

const defaultSettingsPath = '/data/default_settings.json' as const;
let cachedDefaultSettings: AppSettings | null = null;

function isObject(item: unknown): item is Record<string, unknown> {
  return typeof item === 'object' && item !== null && !Array.isArray(item);
}

function mergeDeep(target: unknown, source: unknown): unknown {
  const output: Record<string, unknown> = { ...(target as Record<string, unknown>) };
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

async function loadDefaultSettings(): Promise<AppSettings> {
  if (cachedDefaultSettings) return cachedDefaultSettings;

  try {
    const url = browser.runtime.getURL(defaultSettingsPath);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Workspace err: ${response.statusText}`);
    cachedDefaultSettings = await response.json();
    return cachedDefaultSettings!;
  } catch (error) {
    logger.error("Cannot load defaults:", error);
    return defaultAppSettings;
  }
}

export async function initializeDefaults(): Promise<void> {
  const defaults = await loadDefaultSettings();
  // WXT stores each setting as an individual key (e.g. 'domainRules'), not as a
  // single 'settings' object. Check for the presence of 'domainRules' to detect
  // whether the extension has been installed before.
  // NOTE: still reads storage.sync here for fresh-install detection (lot 3 will migrate this)
  const rawSync = await browser.storage.sync.get('domainRules');

  if (rawSync.domainRules === undefined) {
    logger.debug("Init defaults from JSON...");
    await setSettings(defaults);
  } else {
    logger.debug("Merging existing with JSON defaults...");
    const currentSettings = await getSettings();
    const merged = mergeDeep(defaults, currentSettings) as AppSettings;

    // Migrate missing fields on existing rules (never inject new default rules)
    if (merged.domainRules && Array.isArray(merged.domainRules)) {
      merged.domainRules.forEach((rule) => {
        if (typeof rule.label === 'undefined') {
          const defaultRule = defaults.domainRules.find(dr => dr.id === rule.id);
          rule.label = defaultRule ? defaultRule.label : rule.domainFilter || "Untitled Rule";
        }
        const ruleRecord = rule as DomainRuleSetting & Record<string, unknown>;
        if (typeof ruleRecord.groupId !== 'undefined') {
          delete ruleRecord.groupId;
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
        if (!Array.isArray(rule.ignoredQueryParams)) {
          rule.ignoredQueryParams = [];
        }
      });
    }
    await setSettings(merged);
  }

  const localData = await browser.storage.local.get('statistics');
  if (!localData.statistics) {
    logger.debug("Init stats...");
    await setStatisticsData(defaultStatistics);
  }
}
