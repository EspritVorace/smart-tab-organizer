import { browser } from 'wxt/browser';
import { getSyncSettings, setSyncSettings } from './settingsUtils.js';
import { getStatisticsData, setStatisticsData } from './statisticsUtils.js';
import { defaultSyncSettings } from '../types/syncSettings.js';
import { defaultStatistics } from '../types/statistics.js';
import type { SyncSettings } from '../types/syncSettings.js';

const defaultSettingsPath = 'data/default_settings.json';
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
    console.error("Cannot load defaults:", error);
    return defaultSyncSettings;
  }
}

export async function initializeDefaults(): Promise<void> {
  const defaults = await loadDefaultSettings();
  const syncData = await browser.storage.sync.get('settings');
  
  if (!syncData.settings) {
    console.log("Init defaults from JSON...");
    await setSyncSettings(defaults);
  } else {
    console.log("Merging existing with JSON defaults...");
    const merged = mergeDeep(defaults, syncData.settings);
    
    // Ensure default IDs exist and fill missing new fields
    defaults.regexPresets.forEach(dp => {
      const existing = merged.regexPresets.find((mp: any) => mp.id === dp.id);
      if (!existing) {
        merged.regexPresets.push(dp);
      } else if (typeof existing.urlRegex === 'undefined' && typeof dp.urlRegex !== 'undefined') {
        existing.urlRegex = dp.urlRegex;
      }
    });
    
    merged.regexPresets.forEach((p: any) => {
      if (typeof p.urlRegex === 'undefined') p.urlRegex = '';
    });

    defaults.domainRules.forEach(dr => {
      const existing = merged.domainRules.find((mr: any) => mr.id === dr.id);
      if (!existing) {
        merged.domainRules.push(dr);
      } else {
        if (typeof existing.urlParsingRegEx === 'undefined' && typeof dr.urlParsingRegEx !== 'undefined') {
          existing.urlParsingRegEx = dr.urlParsingRegEx;
        }
        if (typeof existing.groupNameSource === 'undefined' && typeof dr.groupNameSource !== 'undefined') {
          existing.groupNameSource = dr.groupNameSource;
        }
      }
    });

    // Ensure logicalGroups are merged and the default "issues" group is present
    if (!merged.logicalGroups) {
      merged.logicalGroups = defaults.logicalGroups || [];
    }
    const issuesGroupExists = merged.logicalGroups.some((group: any) => group.id === "issues");
    if (!issuesGroupExists && defaults.logicalGroups) {
      const defaultIssuesGroup = defaults.logicalGroups.find(group => group.id === "issues");
      if (defaultIssuesGroup) {
        merged.logicalGroups.push(defaultIssuesGroup);
      }
    }

    // Ensure all domain rules have a label, groupId and new fields
    if (merged.domainRules && Array.isArray(merged.domainRules)) {
      merged.domainRules.forEach((rule: any) => {
        if (typeof rule.label === 'undefined') {
          const defaultRule = defaults.domainRules.find(dr => dr.id === rule.id);
          rule.label = defaultRule ? defaultRule.label : rule.domainFilter || "Untitled Rule";
        }
        if (typeof rule.groupId === 'undefined') {
          rule.groupId = "issues"; // Default to "issues" group
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
    console.log("Init stats...");
    await setStatisticsData(defaultStatistics);
  }
}