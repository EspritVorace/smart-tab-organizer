// js/modules/storage.js
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
        const url = chrome.runtime.getURL(defaultSettingsPath);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Workspace err: ${response.statusText}`);
        cachedDefaultSettings = await response.json();
        return cachedDefaultSettings;
    } catch (error) { console.error("Cannot load defaults:", error); return {}; }
}
export async function getSettings() {
    const defaults = await loadDefaultSettings();
    const data = await chrome.storage.sync.get('settings');
    return mergeDeep(defaults, data.settings || {});
}
export async function saveSettings(settings) { await chrome.storage.sync.set({ settings }); }
export async function getStatistics() {
    const data = await chrome.storage.local.get('statistics');
    return { ...defaultStatistics, ...data.statistics };
}
export async function saveStatistics(statistics) { await chrome.storage.local.set({ statistics }); }
export async function resetStatistics() { await saveStatistics(defaultStatistics); return defaultStatistics; }
export async function incrementStat(key) {
    const stats = await getStatistics();
    stats[key] = (stats[key] || 0) + 1;
    await saveStatistics(stats);
    return stats;
}
export async function initializeDefaults() {
    const defaults = await loadDefaultSettings();
    const syncData = await chrome.storage.sync.get('settings');
    if (!syncData.settings) {
        console.log("Init defaults from JSON...");
        await saveSettings(defaults);
    } else {
        console.log("Merging existing with JSON defaults...");
        const merged = mergeDeep(defaults, syncData.settings);
        // Ensure default IDs exist
        defaults.regexPresets.forEach(dp => { if (!merged.regexPresets.some(mp => mp.id === dp.id)) merged.regexPresets.push(dp); });
        defaults.domainRules.forEach(dr => { if (!merged.domainRules.some(mr => mr.id === dr.id)) merged.domainRules.push(dr); });

        // Ensure all domain rules have a label
        if (merged.domainRules && Array.isArray(merged.domainRules)) {
            merged.domainRules.forEach(rule => {
                if (typeof rule.label === 'undefined') {
                    const defaultRule = defaults.domainRules.find(dr => dr.id === rule.id);
                    rule.label = defaultRule ? defaultRule.label : rule.domainFilter || "Untitled Rule";
                }
            });
        }
        await saveSettings(merged);
    }
    const localData = await chrome.storage.local.get('statistics');
    if (!localData.statistics) { console.log("Init stats..."); await saveStatistics(defaultStatistics); }
}