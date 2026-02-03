import { browser, Browser } from 'wxt/browser';

export const middleClickedTabs = new Map<string, number>();

export function handleMiddleClickMessage(
    request: any, 
    sender: Browser.runtime.MessageSender, 
    sendResponse: (response?: any) => void
): void {
    if (request.type === "middleClickLink") {
        if (sender.tab && sender.tab.id) {
            middleClickedTabs.set(request.url, sender.tab.id);
            console.log(`[GROUPING_DEBUG] Middle click registered: URL ${request.url} from tab ${sender.tab.id}`);
            sendResponse({ status: "received" });
        } else {
            console.warn("[GROUPING_DEBUG] Middle click message received without valid sender.tab.id");
            sendResponse({ status: "error", message: "Missing sender tab ID" });
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
        console.error('promptForGroupName error', e);
        return null;
    }
}

export function findMiddleClickOpener(newTab: Browser.tabs.Tab): number | null {
    const urlToCheck = newTab.pendingUrl || newTab.url;
    
    if (!urlToCheck || !newTab.openerTabId) {
        return null;
    }
    
    if (middleClickedTabs.has(urlToCheck) && middleClickedTabs.get(urlToCheck) === newTab.openerTabId) {
        const openerIdFromMap = middleClickedTabs.get(urlToCheck);
        middleClickedTabs.delete(urlToCheck);
        console.log(`[GROUPING_DEBUG] Direct match for openerIdFromMap: ${openerIdFromMap} (URL: "${urlToCheck}")`);
        return openerIdFromMap;
    }
    
    // Fallback search
    console.log(`[GROUPING_DEBUG] No direct match for URL "${urlToCheck}". Initiating fallback search for openerTabId ${newTab.openerTabId}.`);
    for (const [url, id] of middleClickedTabs.entries()) {
        if (id === newTab.openerTabId) {
            middleClickedTabs.delete(url);
            console.log(`[GROUPING_DEBUG] Fallback match for openerIdFromMap: ${id} (Original map URL was "${url}")`);
            return id;
        }
    }
    
    return null;
}