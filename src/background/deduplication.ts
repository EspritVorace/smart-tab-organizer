import { browser, Browser } from 'wxt/browser';
import { incrementStat } from '@/utils/statisticsUtils.js';
import { logger } from '@/utils/logger.js';
import { matchesDomain } from '@/utils/utils';
import { getSettings } from './settings.js';
import { showNotification, type UndoAction } from '@/utils/notifications.js';
import { getMessage } from '@/utils/i18n.js';
import { shouldSkipDeduplication } from '@/utils/deduplicationSkip.js';
import { normalizeUrlIgnoringParams } from '@/utils/urlNormalization.js';
import type { DomainRuleSetting, SyncSettings } from '@/types/syncSettings.js';

// Cache pour éviter de traiter plusieurs fois le même onglet
const processedTabs = new Set<string>();

export function isDeduplicationEnabled(
    rule: DomainRuleSetting | undefined,
    globalEnabled: boolean,
    deduplicateUnmatched: boolean,
): boolean {
    return rule ? rule.deduplicationEnabled : (globalEnabled && deduplicateUnmatched);
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

export function isUrlMatch(
    existingUrl: string,
    newUrl: string,
    matchMode: string,
    ignoredParams: string[] = [],
): boolean {
    try {
        switch (matchMode) {
            case 'exact':
                return existingUrl === newUrl;
            case 'includes':
                return existingUrl.includes(newUrl) || newUrl.includes(existingUrl);
            case 'exact_ignore_params': {
                const normalizedExisting = normalizeUrlIgnoringParams(existingUrl, ignoredParams);
                const normalizedNew = normalizeUrlIgnoringParams(newUrl, ignoredParams);
                return normalizedExisting === normalizedNew;
            }
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
    windowId: number,
    ignoredParams: string[] = [],
): Promise<Browser.tabs.Tab | undefined> {
    const allTabsInWindow = await browser.tabs.query({
        url: "*://*/*",
        windowId: windowId
    });

    return allTabsInWindow.find(tab => {
        if (!tab.url || tab.id === currentTabId) return false;
        return isUrlMatch(tab.url, newUrl, matchMode, ignoredParams);
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
        logger.warn("Could not focus duplicate tab:", e);
    }
}

export async function removeDuplicateTab(tabId: number): Promise<void> {
    try { 
        await browser.tabs.remove(tabId); 
    } catch (e) { 
        logger.warn("Could not remove duplicate tab:", e);
    }
}

export async function checkAndDeduplicateTab(
    currentTabId: number,
    newUrl: string,
    matchMode: string,
    windowId: number,
    settings: SyncSettings,
    ignoredParams: string[] = [],
): Promise<void> {
    try {
        const duplicateTab = await findDuplicateTab(currentTabId, newUrl, matchMode, windowId, ignoredParams);

        if (duplicateTab) {
            logger.debug(`[DEDUPLICATION] Duplicate found: ${newUrl} (keeping tab ${duplicateTab.id}, removing ${currentTabId})`);

            await incrementStat('tabsDeduplicatedCount');
            await focusAndReloadTab(duplicateTab);
            await removeDuplicateTab(currentTabId);

            // Show notification if enabled with undo action
            if (settings.notifyOnDeduplication) {
                const tabTitle = duplicateTab.title || newUrl;
                const undoAction: UndoAction = {
                    type: 'reopen_tab',
                    data: { url: newUrl, windowId }
                };
                showNotification({
                    title: getMessage('notificationDeduplicationTitle'),
                    message: getMessage('notificationDeduplicationMessage').replace('{title}', tabTitle),
                    type: 'info',
                    undoAction
                });
            }
        }
    } catch (queryError) {
        logger.error("Deduplication: Error querying tabs:", queryError);
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

    // Check if this URL should skip deduplication (e.g., reopened via undo)
    if (shouldSkipDeduplication(urlToCheck)) {
        return;
    }

    markTabAsProcessed(tabId, urlToCheck);

    const settings = await getSettings();
    if (!settings.globalDeduplicationEnabled) return;

    const rule: DomainRuleSetting | undefined = settings.domainRules.find(r => r.enabled && matchesDomain(urlToCheck, r.domainFilter));
    const deduplicationActiveForRule = isDeduplicationEnabled(
        rule,
        settings.globalDeduplicationEnabled,
        settings.deduplicateUnmatchedDomains,
    );

    if (!deduplicationActiveForRule) return;

    const matchMode = getMatchMode(rule);
    const ignoredParams = rule?.ignoredQueryParams ?? [];

    try {
        await checkAndDeduplicateTab(tabId, urlToCheck, matchMode, windowId, settings, ignoredParams);
    } catch (error) {
        logger.error("Deduplication error:", error);
    }
}

// Nettoyage périodique du cache pour éviter l'accumulation
export function startPeriodicCleanup(intervalMs: number = 5 * 60 * 1000): void {
    setInterval(() => {
        clearProcessedTabsCache();
    }, intervalMs);
}