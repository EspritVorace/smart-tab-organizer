import { browser, Browser } from 'wxt/browser';
import { incrementStat } from '../utils/statisticsUtils.js';
import { matchesDomain } from '../utils/utils.js';
import { getSettings } from './settings.js';
import type { DomainRuleSetting } from '../types/syncSettings.js';

// Cache pour éviter de traiter plusieurs fois le même onglet
const processedTabs = new Set<string>();

export function isDeduplicationEnabled(rule: DomainRuleSetting | undefined, globalEnabled: boolean): boolean {
    return rule ? rule.deduplicationEnabled : globalEnabled;
}

export function getMatchMode(rule: DomainRuleSetting | undefined): string {
    return rule ? rule.deduplicationMatchMode : 'exact';
}

export function shouldProcessTab(urlToCheck: string, tabId: number): boolean {
    if (!urlToCheck || 
        urlToCheck.startsWith('about:') || 
        urlToCheck.startsWith('chrome:') ||
        processedTabs.has(`${tabId}-${urlToCheck}`)) {
        return false;
    }
    return true;
}

export function markTabAsProcessed(tabId: number, url: string): void {
    processedTabs.add(`${tabId}-${url}`);
}

export function clearProcessedTabsCache(): void {
    processedTabs.clear();
}

export function isUrlMatch(existingUrl: string, newUrl: string, matchMode: string): boolean {
    try {
        switch (matchMode) {
            case 'exact': 
                return existingUrl === newUrl;
            case 'includes': 
                return existingUrl.includes(newUrl) || newUrl.includes(existingUrl);
            default: 
                return false;
        }
    } catch (urlParseError) { 
        return false; 
    }
}

export async function findDuplicateTab(
    currentTabId: number, 
    newUrl: string, 
    matchMode: string, 
    windowId: number
): Promise<Browser.tabs.Tab | undefined> {
    const allTabsInWindow = await browser.tabs.query({ 
        url: "*://*/*", 
        windowId: windowId 
    });
    
    return allTabsInWindow.find(tab => {
        if (!tab.url || tab.id === currentTabId) return false;
        return isUrlMatch(tab.url, newUrl, matchMode);
    });
}

export async function focusAndReloadTab(duplicateTab: Browser.tabs.Tab): Promise<void> {
    try {
        // Activer l'onglet existant
        await browser.tabs.update(duplicateTab.id, { active: true });
        
        // S'assurer que la fenêtre est focusée
        const dupTabWindow = await browser.windows.get(duplicateTab.windowId);
        if (!dupTabWindow.focused) {
            await browser.windows.update(duplicateTab.windowId, { focused: true });
        }
        
        // Recharger l'onglet existant (optionnel)
        try { 
            await browser.tabs.reload(duplicateTab.id); 
        } catch (e) { 
            // Échec silencieux si reload impossible
        }
    } catch (e) { 
        console.warn("Could not focus duplicate tab:", e);
    }
}

export async function removeDuplicateTab(tabId: number): Promise<void> {
    try { 
        await browser.tabs.remove(tabId); 
    } catch (e) { 
        console.warn("Could not remove duplicate tab:", e);
    }
}

export async function checkAndDeduplicateTab(
    currentTabId: number, 
    newUrl: string, 
    matchMode: string, 
    windowId: number
): Promise<void> {
    try {
        const duplicateTab = await findDuplicateTab(currentTabId, newUrl, matchMode, windowId);

        if (duplicateTab) {
            console.log(`[DEDUPLICATION] Duplicate found: ${newUrl} (keeping tab ${duplicateTab.id}, removing ${currentTabId})`);
            
            await incrementStat('tabsDeduplicatedCount');
            await focusAndReloadTab(duplicateTab);
            await removeDuplicateTab(currentTabId);
        }
    } catch (queryError) { 
        console.error("Deduplication: Error querying tabs:", queryError); 
    }
}

export async function processTabForDeduplication(
    tabId: number, 
    urlToCheck: string, 
    windowId: number
): Promise<void> {
    if (!shouldProcessTab(urlToCheck, tabId)) {
        return;
    }

    markTabAsProcessed(tabId, urlToCheck);
    
    const settings = await getSettings();
    if (!settings.globalDeduplicationEnabled) return;

    const rule: DomainRuleSetting | undefined = settings.domainRules.find(r => r.enabled && matchesDomain(urlToCheck, r.domainFilter));
    const deduplicationActiveForRule = isDeduplicationEnabled(rule, settings.globalDeduplicationEnabled);
    
    if (!deduplicationActiveForRule) return;

    const matchMode = getMatchMode(rule);
    
    try {
        await checkAndDeduplicateTab(tabId, urlToCheck, matchMode, windowId);
    } catch (error) {
        console.error("Deduplication error:", error);
    }
}

// Nettoyage périodique du cache pour éviter l'accumulation
export function startPeriodicCleanup(intervalMs: number = 5 * 60 * 1000): void {
    setInterval(() => {
        clearProcessedTabsCache();
    }, intervalMs);
}