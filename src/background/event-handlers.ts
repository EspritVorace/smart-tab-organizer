import { browser, Browser } from 'wxt/browser';
import { initializeDefaults } from '../utils/migration.js';
import { logger } from '../utils/logger.js';
import { handleMiddleClickMessage, findMiddleClickOpener } from './messaging.js';
import { processTabForDeduplication } from './deduplication.js';
import { processGroupingForNewTab } from './grouping.js';
import { handleOrganizeAllTabs } from './organize.js';
import { loadSessions } from '../utils/sessionStorage.js';
import { restoreTabs } from '../utils/tabRestore.js';
import { getMessage } from '../utils/i18n.js';
import { setProfileWindow, removeWindowAssociations, getProfileForWindow } from '../utils/profileWindowMap.js';
import { persistSyncDraft } from './profileSync.js';

export function setupInstallationHandler(): void {
    browser.runtime.onInstalled.addListener(async (details: Browser.runtime.InstalledDetails) => {
        logger.debug("SmartTab Organizer installed/updated.", details.reason);
        await initializeDefaults();
    });
}

export function setupMessageHandler(): void {
    browser.runtime.onMessage.addListener((request: any, sender: Browser.runtime.MessageSender, sendResponse: (response?: any) => void) => {
        if (request.type === 'ORGANIZE_ALL_TABS') {
            browser.windows.getCurrent()
                .then(win => { if (win.id != null) return handleOrganizeAllTabs(win.id); })
                .catch(e => logger.error('[ORGANIZE_ALL_TABS] Error:', e));
            return false;
        }
        if (request.type === 'RESTORE_PROFILE') {
            handleProfileRestore(
                request.profileId as string,
                request.target as 'current' | 'new',
                request.windowId as number | undefined,
            ).catch(e => logger.error('[RESTORE_PROFILE] Error:', e));
            return false;
        }
        handleMiddleClickMessage(request, sender, sendResponse);
        return true;
    });
}

async function handleProfileRestore(
    profileId: string,
    target: 'current' | 'new',
    senderWindowId: number | undefined,
): Promise<void> {
    const sessions = await loadSessions();
    const session = sessions.find(s => s.id === profileId);
    if (!session) {
        logger.warn(`[RESTORE_PROFILE] Session ${profileId} not found`);
        return;
    }

    const result = await restoreTabs({
        tabs: session.ungroupedTabs,
        groups: session.groups,
        target,
    });

    // Update profile↔window mapping
    if (target === 'current' && senderWindowId != null) {
        await setProfileWindow(profileId, senderWindowId);
    } else if (target === 'new' && result.windowId != null) {
        await setProfileWindow(profileId, result.windowId);
    }

    const groupCount = result.groupsCreated + result.groupsMerged;
    await (browser.notifications as any).create({
        type: 'basic',
        iconUrl: browser.runtime.getURL('/icons/icon128.png'),
        title: getMessage('extensionName'),
        message: getMessage('popupProfileRestored', [session.name, String(result.tabsCreated), String(groupCount)]),
    });
}

export function setupWindowRemovedHandler(): void {
    browser.windows.onRemoved.addListener((windowId: number) => {
        handleWindowRemoved(windowId)
            .catch(e => logger.error('[WINDOW_REMOVED] Error:', e));
    });
}

async function handleWindowRemoved(windowId: number): Promise<void> {
    const profileId = await getProfileForWindow(windowId);

    if (profileId) {
        // Persist the in-memory draft to the profile before cleaning up the mapping
        const sessions = await loadSessions();
        const profile = sessions.find(s => s.id === profileId);

        if (profile?.autoSync) {
            await persistSyncDraft(profileId);
        }
    }

    await removeWindowAssociations(windowId);
}

// Pending grouping operations keyed by new tab ID.
// Stored at module level so the top-level onUpdated listener can access them
// even if the service worker was restarted between onTabCreated and onUpdated.
const pendingGroupings = new Map<number, { openerTab: Browser.tabs.Tab; newTab: Browser.tabs.Tab }>();

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

        try {
            const openerTab = await browser.tabs.get(openerIdFromMap);
            if (openerTab) {
                logger.debug(`[GROUPING_DEBUG] onCreated: Registering pending grouping for new tab ${newTab.id}.`);
                pendingGroupings.set(newTab.id!, { openerTab, newTab });

                // Fast-load race: the tab may have already reached status=complete before
                // pendingGroupings.set() ran (e.g. for local/Playwright-served pages).
                // Detect and process immediately in that case.
                try {
                    const currentNewTab = await browser.tabs.get(newTab.id!);
                    if (currentNewTab.status === 'complete' && currentNewTab.url &&
                        !currentNewTab.url.startsWith('about:') && !currentNewTab.url.startsWith('chrome:')) {
                        const pending = pendingGroupings.get(newTab.id!);
                        if (pending) {
                            pendingGroupings.delete(newTab.id!);
                            logger.debug(`[GROUPING_DEBUG] onCreated: Tab ${newTab.id} already complete, processing grouping immediately.`);
                            await processGroupingForNewTab(pending.openerTab, pending.newTab);
                        }
                    }
                } catch (_) { /* tab was closed before we could check */ }
            } else {
                logger.debug(`[GROUPING_DEBUG] onCreated: Opener tab ${openerIdFromMap} not found.`);
            }
        } catch (e) {
            if (e.message && e.message.toLowerCase().includes("no tab with id")) {
                logger.debug(`[GROUPING_DEBUG] onCreated: Opener tab ${openerIdFromMap} was closed.`);
            } else {
                logger.error(`[GROUPING_DEBUG] onCreated: Error getting opener tab ${openerIdFromMap}:`, e);
            }
        }
    });
}

export function setupTabUpdatedHandler(): void {
    browser.tabs.onUpdated.addListener(async (tabId: number, changeInfo: Browser.tabs.OnUpdatedInfo, tab: Browser.tabs.Tab) => {
        const urlToCheck = changeInfo.url || (changeInfo.status === 'complete' ? tab.url : null);

        if (urlToCheck && tab.windowId) {
            await processTabForDeduplication(tabId, urlToCheck, tab.windowId);
        }

        // URL-based fallback: when Chrome doesn't expose openerTabId in onTabCreated
        // (e.g. tabs opened via chrome.tabs.create from the extension), look up
        // middleClickedTabs by the navigated URL instead.
        const navUrl = changeInfo.url || tab.url;
        if (navUrl && !navUrl.startsWith('about:') && !navUrl.startsWith('chrome:') && !pendingGroupings.has(tabId)) {
            const middleClickedTabs = (globalThis as any).middleClickedTabs as Map<string, number> | undefined;
            if (middleClickedTabs?.has(navUrl)) {
                const openerTabId = middleClickedTabs.get(navUrl)!;
                middleClickedTabs.delete(navUrl);
                logger.debug(`[GROUPING_DEBUG] onUpdated: URL-based match for tab ${tabId} (URL: "${navUrl}"), openerTabId: ${openerTabId}.`);
                try {
                    const openerTab = await browser.tabs.get(openerTabId);
                    // Re-fetch the new tab to get its current status (may have changed while awaiting).
                    const currentNewTab = await browser.tabs.get(tabId).catch(() => null);
                    if (!currentNewTab) return; // tab was closed
                    if (currentNewTab.status === 'complete' && currentNewTab.url && !currentNewTab.url.startsWith('about:')) {
                        // Tab already complete — process grouping immediately.
                        logger.debug(`[GROUPING_DEBUG] onUpdated: URL-based match, tab ${tabId} already complete. Processing now.`);
                        await processGroupingForNewTab(openerTab, currentNewTab);
                    } else {
                        // Tab still loading — register pending grouping for onTabUpdated(complete).
                        pendingGroupings.set(tabId, { openerTab, newTab: currentNewTab });
                        logger.debug(`[GROUPING_DEBUG] onUpdated: URL-based match, registered pending grouping for tab ${tabId}.`);
                    }
                } catch (e) {
                    logger.warn(`[GROUPING_DEBUG] onUpdated: Opener tab ${openerTabId} not found for URL-based match.`);
                }
            }
        }

        // Process any pending grouping for this tab once it finishes loading.
        if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('about:')) {
            const pending = pendingGroupings.get(tabId);
            if (pending) {
                pendingGroupings.delete(tabId);
                logger.debug(`[GROUPING_DEBUG] onUpdated: Processing pending grouping for tab ${tabId} with URL: "${tab.url}".`);
                await processGroupingForNewTab(pending.openerTab, pending.newTab);
            }
        }
    });
}

export function setupAllEventHandlers(): void {
    setupInstallationHandler();
    setupMessageHandler();
    setupTabCreatedHandler();
    setupTabUpdatedHandler();
    setupWindowRemovedHandler();
}