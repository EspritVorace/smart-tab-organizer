import { browser, Browser } from 'wxt/browser';
import { initializeDefaults } from '../utils/migration.js';
import { handleMiddleClickMessage, findMiddleClickOpener } from './messaging.js';
import { processTabForDeduplication } from './deduplication.js';
import { processGroupingForNewTab } from './grouping.js';

export function setupInstallationHandler(): void {
    browser.runtime.onInstalled.addListener(async (details: Browser.runtime.InstalledDetails) => {
        console.log("SmartTab Organizer installed/updated.", details.reason);
        await initializeDefaults();
    });
}

export function setupMessageHandler(): void {
    browser.runtime.onMessage.addListener((request: any, sender: Browser.runtime.MessageSender, sendResponse: (response?: any) => void) => {
        handleMiddleClickMessage(request, sender, sendResponse);
        return true;
    });
}

export function setupTabCreatedHandler(): void {
    browser.tabs.onCreated.addListener(async (newTab: Browser.tabs.Tab) => {
        const urlToCheck = newTab.pendingUrl || newTab.url;
        console.log(`[GROUPING_DEBUG] onCreated: New tab ${newTab.id}, Opener ID: ${newTab.openerTabId}, URL: "${urlToCheck}"`);

        if (!newTab.openerTabId || !urlToCheck) {
            console.log(`[GROUPING_DEBUG] onCreated: New tab ${newTab.id} has no openerTabId or URL. No grouping action.`);
            return;
        }

        const openerIdFromMap = findMiddleClickOpener(newTab);
        if (!openerIdFromMap) {
            console.log(`[GROUPING_DEBUG] onCreated: No opener found for new tab ${newTab.id}. No grouping action.`);
            return;
        }

        console.log(`[GROUPING_DEBUG] onCreated: Opener ${openerIdFromMap} found for new tab ${newTab.id}.`);
        
        try {
            const openerTab = await browser.tabs.get(openerIdFromMap);
            if (openerTab) {
                console.log(`[GROUPING_DEBUG] onCreated: Calling handleGrouping for new tab ${newTab.id}.`);
                await handleGroupingWithRetry(openerTab, newTab);
            } else {
                console.log(`[GROUPING_DEBUG] onCreated: Opener tab ${openerIdFromMap} not found.`);
            }
        } catch (e) {
            if (e.message && e.message.toLowerCase().includes("no tab with id")) {
                console.log(`[GROUPING_DEBUG] onCreated: Opener tab ${openerIdFromMap} was closed.`);
            } else {
                console.error(`[GROUPING_DEBUG] onCreated: Error getting opener tab ${openerIdFromMap}:`, e);
            }
        }
    });
}

export function setupTabUpdatedHandler(): void {
    browser.tabs.onUpdated.addListener(async (tabId: number, changeInfo: Browser.tabs.TabChangeInfo, tab: Browser.tabs.Tab) => {
        const urlToCheck = changeInfo.url || (changeInfo.status === 'complete' ? tab.url : null);
        
        if (urlToCheck && tab.windowId) {
            await processTabForDeduplication(tabId, urlToCheck, tab.windowId);
        }
    });
}

async function handleGroupingWithRetry(openerTab: Browser.tabs.Tab, newTab: Browser.tabs.Tab): Promise<void> {
    let hasProcessedTab = false;

    const listener = async (tabId: number, changeInfo: Browser.tabs.TabChangeInfo, tab: Browser.tabs.Tab) => {
        if (hasProcessedTab) {
            try { 
                browser.tabs.onUpdated.removeListener(listener); 
            } catch (e) {}
            return;
        }

        if (tabId === newTab.id) {
            console.log(`[GROUPING_DEBUG] onUpdated listener: Fired for tab ${tabId}. Status: ${changeInfo.status}, URL: ${tab?.url}, Title: "${tab?.title}"`);
        }

        if (tabId === newTab.id && changeInfo.status === 'complete' && tab.url) {
            if (tab.url.startsWith('about:') || tab.url.startsWith('chrome:')) {
                console.log(`[GROUPING_DEBUG] onUpdated listener: Tab ${newTab.id} has URL '${tab.url}'. Waiting for definitive URL.`);
                return;
            }

            hasProcessedTab = true;
            browser.tabs.onUpdated.removeListener(listener);
            console.log(`[GROUPING_DEBUG] onUpdated listener: Processing tab ${newTab.id} with URL: "${tab.url}".`);

            await processGroupingForNewTab(openerTab, newTab);
        }
    };

    browser.tabs.onUpdated.addListener(listener);
}

export function setupAllEventHandlers(): void {
    setupInstallationHandler();
    setupMessageHandler();
    setupTabCreatedHandler();
    setupTabUpdatedHandler();
}