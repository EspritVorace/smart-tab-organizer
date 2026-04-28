import { browser, Browser } from 'wxt/browser';
import { incrementStat } from '@/utils/statisticsUtils.js';
import { logger } from '@/utils/logger.js';
import { matchesDomain } from '@/utils/utils';
import { getSettings } from './settings.js';
import { showNotification, type UndoAction } from '@/utils/notifications.js';
import { getMessage } from '@/utils/i18n.js';
import { shouldSkipDeduplication } from '@/utils/deduplicationSkip.js';
import { normalizeUrlIgnoringParams } from '@/utils/urlNormalization.js';
import type { DomainRuleSetting, AppSettings } from '@/types/syncSettings.js';
import type { DeduplicationKeepStrategyValue } from '@/schemas/enums.js';

// Cache pour éviter de traiter plusieurs fois le même onglet
const processedTabs = new Set<string>();

// Chrome uses -1 (TAB_GROUP_ID_NONE) to denote an ungrouped tab.
const TAB_GROUP_ID_NONE = -1;

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
        logger.debug('[DEDUP] URL parse error:', urlParseError);
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

function isGrouped(tab: Browser.tabs.Tab): boolean {
    const groupId = tab.groupId;
    return typeof groupId === 'number' && groupId > TAB_GROUP_ID_NONE;
}

export interface DedupDecision {
    tabToKeep: Browser.tabs.Tab;
    tabToClose: Browser.tabs.Tab;
}

/**
 * Pure decision: given the existing (old) duplicate and the newly opened tab,
 * decide which survives based on the configured keep strategy.
 *
 * The two "grouped" strategies always keep the tab that belongs to a group
 * when only one of the two does. They differ on the tie-breaker when neither
 * or both are grouped: `keep-grouped` falls back to keeping the old tab,
 * `keep-grouped-or-new` falls back to keeping the new tab.
 */
export function decideDedupDirection(
    oldTab: Browser.tabs.Tab,
    newTab: Browser.tabs.Tab,
    strategy: DeduplicationKeepStrategyValue,
): DedupDecision {
    if (strategy === 'keep-new') {
        return { tabToKeep: newTab, tabToClose: oldTab };
    }
    if (strategy === 'keep-grouped' || strategy === 'keep-grouped-or-new') {
        const oldGrouped = isGrouped(oldTab);
        const newGrouped = isGrouped(newTab);
        if (oldGrouped && !newGrouped) {
            return { tabToKeep: oldTab, tabToClose: newTab };
        }
        if (!oldGrouped && newGrouped) {
            return { tabToKeep: newTab, tabToClose: oldTab };
        }
        // Tie-breaker depends on which flavor the user picked.
        if (strategy === 'keep-grouped-or-new') {
            return { tabToKeep: newTab, tabToClose: oldTab };
        }
        return { tabToKeep: oldTab, tabToClose: newTab };
    }
    // keep-old (default for `keep-old`)
    return { tabToKeep: oldTab, tabToClose: newTab };
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
            logger.debug('[DEDUP] Tab reload failed:', e);
        }
    } catch (e) {
        logger.warn("Could not focus duplicate tab:", e);
    }
}

async function focusTabWithoutReload(tab: Browser.tabs.Tab): Promise<void> {
    try {
        await browser.tabs.update(tab.id, { active: true });
        const tabWindow = await browser.windows.get(tab.windowId);
        if (!tabWindow.focused) {
            await browser.windows.update(tab.windowId, { focused: true });
        }
    } catch (e) {
        logger.warn("Could not focus kept tab:", e);
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
    settings: AppSettings,
    ignoredParams: string[] = [],
    ruleId: string = '__unmatched__',
): Promise<void> {
    try {
        const duplicateTab = await findDuplicateTab(currentTabId, newUrl, matchMode, windowId, ignoredParams);
        if (!duplicateTab) return;

        let currentTab: Browser.tabs.Tab;
        try {
            currentTab = await browser.tabs.get(currentTabId);
        } catch (err) {
            logger.warn(`[DEDUPLICATION] Could not load current tab ${currentTabId}:`, err);
            return;
        }

        const strategy = settings.deduplicationKeepStrategy;
        const { tabToKeep, tabToClose } = decideDedupDirection(duplicateTab, currentTab, strategy);

        if (tabToClose.id === undefined) {
            logger.warn('[DEDUPLICATION] Tab to close has no id, aborting');
            return;
        }

        // Capture metadata BEFORE removing so undo can restore group membership.
        const closedTabMeta = {
            url: tabToClose.url || newUrl,
            title: tabToClose.title,
            groupId: typeof tabToClose.groupId === 'number' ? tabToClose.groupId : undefined,
            index: tabToClose.index,
            windowId: tabToClose.windowId,
        };

        logger.debug(
            `[DEDUPLICATION] Duplicate found for ${newUrl} (strategy=${strategy}, keeping ${tabToKeep.id}, closing ${tabToClose.id})`,
        );

        await incrementStat('dedup', ruleId);

        const keepIsExisting = tabToKeep.id === duplicateTab.id;
        if (keepIsExisting) {
            await focusAndReloadTab(tabToKeep);
        } else {
            // Newly opened tab wins: it is already loading, no reload needed.
            await focusTabWithoutReload(tabToKeep);
        }
        await removeDuplicateTab(tabToClose.id);

        if (settings.notifyOnDeduplication) {
            const tabTitle = closedTabMeta.title || closedTabMeta.url;
            const undoAction: UndoAction = {
                type: 'reopen_tab',
                data: {
                    url: closedTabMeta.url,
                    windowId: closedTabMeta.windowId,
                    groupId: closedTabMeta.groupId,
                    title: closedTabMeta.title,
                    index: closedTabMeta.index,
                },
            };
            showNotification({
                title: getMessage('notificationDeduplicationTitle'),
                message: getMessage('notificationDeduplicationMessage').replace('{title}', tabTitle),
                type: 'info',
                undoAction,
            });
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
    const ruleId = rule?.id ?? '__unmatched__';

    try {
        await checkAndDeduplicateTab(tabId, urlToCheck, matchMode, windowId, settings, ignoredParams, ruleId);
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
