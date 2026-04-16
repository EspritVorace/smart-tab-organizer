import { browser, Browser } from 'wxt/browser';
import { logger } from '@/utils/logger.js';
import type { MiddleClickMessage, MessageResponse } from '@/types/messages.js';

export const middleClickedTabs = new Map<string, number>();

export function handleMiddleClickMessage(
    request: MiddleClickMessage,
    sender: Browser.runtime.MessageSender,
    sendResponse: (response?: MessageResponse) => void
): void {
    if (sender.tab && sender.tab.id) {
        middleClickedTabs.set(request.url, sender.tab.id);
        logger.debug(`[GROUPING_DEBUG] Middle click registered: URL ${request.url} from tab ${sender.tab.id}`);
        sendResponse({ status: "received" });
    } else {
        logger.warn("[GROUPING_DEBUG] Middle click message received without valid sender.tab.id");
        sendResponse({ status: "error", message: "Missing sender tab ID" });
    }
}

export function cleanupMiddleClickedTabsForTab(tabId: number): void {
    for (const [url, id] of middleClickedTabs.entries()) {
        if (id === tabId) {
            middleClickedTabs.delete(url);
        }
    }
}

export async function promptForGroupName(defaultName: string, tabId: number): Promise<string | null> {
    try {
        const response = await browser.tabs.sendMessage(tabId, {
            type: 'askGroupName',
            defaultName
        });
        return response?.name && response.name.trim() ? response.name.trim() : null;
    } catch (e) {
        logger.error('promptForGroupName error', e);
        return null;
    }
}

export function findMiddleClickOpener(newTab: Browser.tabs.Tab): number | null {
    const urlToCheck = newTab.pendingUrl || newTab.url;
    
    if (!newTab.openerTabId) {
        return null;
    }

    if (urlToCheck && middleClickedTabs.has(urlToCheck) && middleClickedTabs.get(urlToCheck) === newTab.openerTabId) {
        const openerIdFromMap = middleClickedTabs.get(urlToCheck);
        middleClickedTabs.delete(urlToCheck);
        logger.debug(`[GROUPING_DEBUG] Direct match for openerIdFromMap: ${openerIdFromMap} (URL: "${urlToCheck}")`);
        return openerIdFromMap;
    }
    
    // Fallback search
    logger.debug(`[GROUPING_DEBUG] No direct match for URL "${urlToCheck}". Initiating fallback search for openerTabId ${newTab.openerTabId}.`);
    for (const [url, id] of middleClickedTabs.entries()) {
        if (id === newTab.openerTabId) {
            middleClickedTabs.delete(url);
            logger.debug(`[GROUPING_DEBUG] Fallback match for openerIdFromMap: ${id} (Original map URL was "${url}")`);
            return id;
        }
    }
    
    return null;
}