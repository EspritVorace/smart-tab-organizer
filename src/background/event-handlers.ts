import { browser, Browser } from 'wxt/browser';
import { initializeDefaults } from '@/utils/migration.js';
import { migrateSettingsFromSyncToLocal, migrateRulesAddUrlExtractionMode, seedBuiltInCategories } from './migration.js';
import { initCategoriesStore } from '@/utils/categoriesStore.js';
import { logger } from '@/utils/logger.js';
import {
    handleMiddleClickMessage,
    handleSessionRestoreSkipDedupMessage,
    findMiddleClickOpener,
    cleanupMiddleClickedTabsForTab,
} from './messaging.js';
import { processTabForDeduplication } from './deduplication.js';
import { processGroupingForNewTab } from './grouping.js';
import { handleOrganizeAllTabs } from './organize.js';
import type { BackgroundMessage, MessageResponse } from '@/types/messages.js';

function isBackgroundMessage(value: unknown): value is BackgroundMessage {
    return typeof value === 'object' && value !== null && 'type' in value
        && typeof (value as { type: unknown }).type === 'string';
}
export function setupInstallationHandler(): void {
    browser.runtime.onInstalled.addListener(async (details: Browser.runtime.InstalledDetails) => {
        logger.debug("SmartTab Organizer installed/updated.", details.reason);
        await migrateSettingsFromSyncToLocal();
        await migrateRulesAddUrlExtractionMode();
        await initializeDefaults();
        await seedBuiltInCategories();
        await initCategoriesStore();
    });
}

export function setupMessageHandler(): void {
    browser.runtime.onMessage.addListener((
        request: unknown,
        sender: Browser.runtime.MessageSender,
        sendResponse: (response?: MessageResponse) => void,
    ) => {
        if (!isBackgroundMessage(request)) return false;

        if (request.type === 'ORGANIZE_ALL_TABS') {
            browser.windows.getCurrent()
                .then(win => { if (win.id != null) return handleOrganizeAllTabs(win.id); })
                .catch(e => logger.error('[ORGANIZE_ALL_TABS] Error:', e));
            return false;
        }

        if (request.type === 'middleClickLink') {
            handleMiddleClickMessage(request, sender, sendResponse);
            return true;
        }

        if (request.type === 'SESSION_RESTORE_SKIP_DEDUP') {
            handleSessionRestoreSkipDedupMessage(request, sendResponse);
            return true;
        }

        return false;
    });
}

export function setupWindowRemovedHandler(): void {
    browser.windows.onRemoved.addListener((_windowId: number) => {
        // No-op: window cleanup handled locally
    });
}

// Pending grouping operations keyed by new tab ID.
// Stored at module level so the top-level onUpdated listener can access them
// even if the service worker was restarted between onTabCreated and onUpdated.
const pendingGroupings = new Map<number, { openerTab: Browser.tabs.Tab; newTab: Browser.tabs.Tab }>();

// Drop pending grouping state and registered middle-click URLs for closed tabs
// so the module-level Maps don't grow unbounded over long-lived service workers.
export function setupTabRemovedHandler(): void {
    browser.tabs.onRemoved.addListener((tabId: number) => {
        if (pendingGroupings.delete(tabId)) {
            logger.debug(`[GROUPING_DEBUG] onRemoved: dropped pending grouping for tab ${tabId}.`);
        }
        cleanupMiddleClickedTabsForTab(tabId);
    });
}

function isProcessableUrl(url: string | undefined): url is string {
    return !!url && !url.startsWith('about:') && !url.startsWith('chrome:');
}

// Fast-load race: the tab may have already reached status=complete before
// pendingGroupings.set() ran (e.g. for local/Playwright-served pages).
async function tryProcessFastLoadGrouping(newTabId: number): Promise<void> {
    try {
        const currentNewTab = await browser.tabs.get(newTabId);
        if (currentNewTab.status !== 'complete' || !isProcessableUrl(currentNewTab.url)) return;
        const pending = pendingGroupings.get(newTabId);
        if (!pending) return;
        pendingGroupings.delete(newTabId);
        logger.debug(`[GROUPING_DEBUG] onCreated: Tab ${newTabId} already complete, processing grouping immediately.`);
        await processGroupingForNewTab(pending.openerTab, pending.newTab);
    } catch (e) {
        logger.debug(`[GROUPING_DEBUG] onCreated: fast-load status check failed for tab ${newTabId} (likely closed):`, e);
    }
}

async function registerPendingGroupingForNewTab(newTab: Browser.tabs.Tab, openerIdFromMap: number): Promise<void> {
    try {
        const openerTab = await browser.tabs.get(openerIdFromMap);
        if (!openerTab) {
            logger.debug(`[GROUPING_DEBUG] onCreated: Opener tab ${openerIdFromMap} not found.`);
            return;
        }
        logger.debug(`[GROUPING_DEBUG] onCreated: Registering pending grouping for new tab ${newTab.id}.`);
        pendingGroupings.set(newTab.id!, { openerTab, newTab });
        await tryProcessFastLoadGrouping(newTab.id!);
    } catch (e) {
        if (e.message && e.message.toLowerCase().includes("no tab with id")) {
            logger.debug(`[GROUPING_DEBUG] onCreated: Opener tab ${openerIdFromMap} was closed.`);
        } else {
            logger.error(`[GROUPING_DEBUG] onCreated: Error getting opener tab ${openerIdFromMap}:`, e);
        }
    }
}

export function setupTabCreatedHandler(): void {
    browser.tabs.onCreated.addListener(async (newTab: Browser.tabs.Tab) => {
        const urlToCheck = newTab.pendingUrl || newTab.url;
        logger.debug(`[GROUPING_DEBUG] onCreated: New tab ${newTab.id}, Opener ID: ${newTab.openerTabId}, URL: "${urlToCheck}"`);

        if (!newTab.openerTabId) {
            logger.debug(`[GROUPING_DEBUG] onCreated: New tab ${newTab.id} has no openerTabId. No grouping action.`);
            return;
        }

        const openerIdFromMap = findMiddleClickOpener(newTab);
        if (!openerIdFromMap) {
            logger.debug(`[GROUPING_DEBUG] onCreated: No opener found for new tab ${newTab.id}. No grouping action.`);
            return;
        }

        logger.debug(`[GROUPING_DEBUG] onCreated: Opener ${openerIdFromMap} found for new tab ${newTab.id}.`);
        await registerPendingGroupingForNewTab(newTab, openerIdFromMap);
    });
}

export function setupTabUpdatedHandler(): void {
    browser.tabs.onUpdated.addListener(async (tabId: number, changeInfo: Browser.tabs.OnUpdatedInfo, tab: Browser.tabs.Tab) => {
        const urlToCheck = changeInfo.url || (changeInfo.status === 'complete' ? tab.url : null);

        if (urlToCheck && tab.windowId) {
            await processTabForDeduplication(tabId, urlToCheck, tab.windowId);
        }

        await tryRegisterFallbackGrouping(tabId, changeInfo, tab);
        await flushPendingGroupingOnComplete(tabId, changeInfo, tab);
    });
}

// URL-based fallback: when the browser doesn't expose openerTabId in onTabCreated
// (e.g. tabs opened via browser.tabs.create from the extension), look up
// middleClickedTabs by the navigated URL instead.
// openerTabId-based fallback: handles the combination of SW timing race
// (message arrives after onTabCreated) + URL mismatch (e.g. Chrome transparently
// resolves Google's redirect URL so the tab never navigates through it).
function findMatchedOpenerForUpdate(navUrl: string, openerTabId: number | undefined, tabId: number): number | undefined {
    const middleClickedTabs = globalThis.middleClickedTabs;
    if (!middleClickedTabs) return undefined;

    if (middleClickedTabs.has(navUrl)) {
        const matched = middleClickedTabs.get(navUrl)!;
        middleClickedTabs.delete(navUrl);
        logger.debug(`[GROUPING_DEBUG] onUpdated: URL-based match for tab ${tabId} (URL: "${navUrl}"), openerTabId: ${matched}.`);
        return matched;
    }
    if (openerTabId == null) return undefined;
    for (const [clickedUrl, id] of middleClickedTabs.entries()) {
        if (id === openerTabId) {
            middleClickedTabs.delete(clickedUrl);
            logger.debug(`[GROUPING_DEBUG] onUpdated: openerTabId-based match for tab ${tabId} (openerTabId: ${openerTabId}, registered URL was "${clickedUrl}").`);
            return id;
        }
    }
    return undefined;
}

async function processMatchedOpenerForUpdate(tabId: number, matchedOpenerTabId: number): Promise<void> {
    try {
        const openerTab = await browser.tabs.get(matchedOpenerTabId);
        // Re-fetch the new tab to get its current status (may have changed while awaiting).
        const currentNewTab = await browser.tabs.get(tabId).catch(() => null);
        if (!currentNewTab) return; // tab was closed
        if (currentNewTab.status === 'complete' && currentNewTab.url && !currentNewTab.url.startsWith('about:')) {
            // Tab already complete: process grouping immediately.
            logger.debug(`[GROUPING_DEBUG] onUpdated: Tab ${tabId} already complete. Processing now.`);
            await processGroupingForNewTab(openerTab, currentNewTab);
            return;
        }
        // Tab still loading: register pending grouping for onTabUpdated(complete).
        pendingGroupings.set(tabId, { openerTab, newTab: currentNewTab });
        logger.debug(`[GROUPING_DEBUG] onUpdated: Registered pending grouping for tab ${tabId}.`);
    } catch (e) {
        logger.warn(`[GROUPING_DEBUG] onUpdated: Opener tab ${matchedOpenerTabId} not found.`, e);
    }
}

async function tryRegisterFallbackGrouping(
    tabId: number,
    changeInfo: Browser.tabs.OnUpdatedInfo,
    tab: Browser.tabs.Tab,
): Promise<void> {
    const navUrl = changeInfo.url || tab.url;
    if (!navUrl || navUrl.startsWith('about:') || navUrl.startsWith('chrome:')) return;
    if (pendingGroupings.has(tabId)) return;

    const matchedOpenerTabId = findMatchedOpenerForUpdate(navUrl, tab.openerTabId, tabId);
    if (matchedOpenerTabId === undefined) return;

    await processMatchedOpenerForUpdate(tabId, matchedOpenerTabId);
}

async function flushPendingGroupingOnComplete(
    tabId: number,
    changeInfo: Browser.tabs.OnUpdatedInfo,
    tab: Browser.tabs.Tab,
): Promise<void> {
    if (changeInfo.status !== 'complete' || !tab.url || tab.url.startsWith('about:')) return;
    const pending = pendingGroupings.get(tabId);
    if (!pending) return;
    pendingGroupings.delete(tabId);
    logger.debug(`[GROUPING_DEBUG] onUpdated: Processing pending grouping for tab ${tabId} with URL: "${tab.url}".`);
    await processGroupingForNewTab(pending.openerTab, pending.newTab);
}

export function setupAllEventHandlers(): void {
    setupInstallationHandler();
    setupMessageHandler();
    setupTabCreatedHandler();
    setupTabUpdatedHandler();
    setupTabRemovedHandler();
    setupWindowRemovedHandler();
}