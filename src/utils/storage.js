// js/modules/storage.js
import { browser } from 'wxt/browser';
const defaultStatistics = { tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 0 };
const defaultSettingsPath = 'data/default_settings.json';
let cachedDefaultSettings = null;

function isObject(item) { return (item && typeof item === 'object' && !Array.isArray(item)); }
function mergeDeep(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) output[key] = key in target ? mergeDeep(target[key], source[key]) : source[key];
            else output[key] = source[key]; // Arrays & primitives: source wins
        });
    }
    return output;
}
async function loadDefaultSettings() {
    if (cachedDefaultSettings) return cachedDefaultSettings;
    try {
        const url = browser.runtime.getURL(defaultSettingsPath);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Workspace err: ${response.statusText}`);
        cachedDefaultSettings = await response.json();
        return cachedDefaultSettings;
    } catch (error) { console.error("Cannot load defaults:", error); return {}; }
}
export async function getSettings() {
    const defaults = await loadDefaultSettings();
    const data = await browser.storage.sync.get('settings');
    return mergeDeep(defaults, data.settings || {});
}
export async function saveSettings(settings) { await browser.storage.sync.set({ settings }); }
export async function getStatistics() {
    const data = await browser.storage.local.get('statistics');
    return { ...defaultStatistics, ...data.statistics };
}
export async function saveStatistics(statistics) { await browser.storage.local.set({ statistics }); }
export async function resetStatistics() { await saveStatistics(defaultStatistics); return defaultStatistics; }
export async function incrementStat(key) {
    const stats = await getStatistics();
    stats[key] = (stats[key] || 0) + 1;
    await saveStatistics(stats);
    return stats;
}
export async function initializeDefaults() {
    const defaults = await loadDefaultSettings();
    const syncData = await browser.storage.sync.get('settings');
    if (!syncData.settings) {
        console.log("Init defaults from JSON...");
        await saveSettings(defaults);
    } else {
        console.log("Merging existing with JSON defaults...");
        const merged = mergeDeep(defaults, syncData.settings);
        // Ensure default IDs exist and fill missing new fields
        defaults.regexPresets.forEach(dp => {
            const existing = merged.regexPresets.find(mp => mp.id === dp.id);
            if (!existing) {
                merged.regexPresets.push(dp);
            } else if (typeof existing.urlRegex === 'undefined' && typeof dp.urlRegex !== 'undefined') {
                existing.urlRegex = dp.urlRegex;
            }
        });
        merged.regexPresets.forEach(p => {
            if (typeof p.urlRegex === 'undefined') p.urlRegex = '';
        });

        defaults.domainRules.forEach(dr => {
            const existing = merged.domainRules.find(mr => mr.id === dr.id);
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
        const issuesGroupExists = merged.logicalGroups.some(group => group.id === "issues");
        if (!issuesGroupExists && defaults.logicalGroups) {
            const defaultIssuesGroup = defaults.logicalGroups.find(group => group.id === "issues");
            if (defaultIssuesGroup) {
                merged.logicalGroups.push(defaultIssuesGroup);
            }
        }

        // Ensure all domain rules have a label, groupId and new fields
        if (merged.domainRules && Array.isArray(merged.domainRules)) {
            merged.domainRules.forEach(rule => {
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
        await saveSettings(merged);
    }
    const localData = await browser.storage.local.get('statistics');
    if (!localData.statistics) { console.log("Init stats..."); await saveStatistics(defaultStatistics); }
}