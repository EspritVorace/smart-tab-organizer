// js/background.js
import { getSettings as storageGetSettings, incrementStat, initializeDefaults } from './modules/storage.js';
import { matchesDomain, extractGroupNameFromTitle } from './modules/utils.js';

const middleClickedTabs = new Map();

async function getSettings() {
    const settings = await storageGetSettings();
    settings.domainRules = settings.domainRules || [];
    settings.domainRules = settings.domainRules.map(rule => ({
        ...rule,
        collapseNew: typeof rule.collapseNew === 'boolean' ? rule.collapseNew : false,
        collapseExisting: typeof rule.collapseExisting === 'boolean' ? rule.collapseExisting : false,
        deduplicationEnabled: typeof rule.deduplicationEnabled === 'boolean' ? rule.deduplicationEnabled : true,
        deduplicationMatchMode: rule.deduplicationMatchMode || 'exact'
    }));
    return settings;
}

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("SmartTab Organizer installed/updated.", details.reason);
  await initializeDefaults();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
    return true;
});

chrome.tabs.onCreated.addListener(async (newTab) => {
    const urlToCheck = newTab.pendingUrl || newTab.url;
    console.log(`[GROUPING_DEBUG] onCreated: New tab ${newTab.id}, Opener ID: ${newTab.openerTabId}, URL to check: "${urlToCheck}"`);

    if (newTab.openerTabId && urlToCheck) {
        let openerIdFromMap = null;
        if (middleClickedTabs.has(urlToCheck) && middleClickedTabs.get(urlToCheck) === newTab.openerTabId) {
             openerIdFromMap = middleClickedTabs.get(urlToCheck);
             middleClickedTabs.delete(urlToCheck);
             console.log(`[GROUPING_DEBUG] onCreated: Direct match for openerIdFromMap: ${openerIdFromMap} (URL: "${urlToCheck}")`);
        } else {
            console.log(`[GROUPING_DEBUG] onCreated: No direct match for URL "${urlToCheck}". Initiating fallback search for openerTabId ${newTab.openerTabId}.`);
            for (const [url, id] of middleClickedTabs.entries()) {
                if (id === newTab.openerTabId) {
                    openerIdFromMap = id;
                    middleClickedTabs.delete(url);
                    console.log(`[GROUPING_DEBUG] onCreated: Fallback match for openerIdFromMap: ${openerIdFromMap} (Original map URL was "${url}")`);
                    break;
                }
            }
        }

        if (openerIdFromMap) {
            console.log(`[GROUPING_DEBUG] onCreated: OpenerId ${openerIdFromMap} found for new tab ${newTab.id}. Attempting to get opener tab details.`);
            try {
                const openerTab = await chrome.tabs.get(openerIdFromMap);
                if (openerTab) {
                    console.log(`[GROUPING_DEBUG] onCreated: Opener tab ${openerTab.id} retrieved. Calling handleGrouping for new tab ${newTab.id}.`);
                    handleGrouping(openerTab, newTab);
                } else {
                    console.log(`[GROUPING_DEBUG] onCreated: Opener tab ${openerIdFromMap} not found (get returned no tab). No grouping for new tab ${newTab.id}.`);
                }
            } catch(e) {
                if (e.message && e.message.toLowerCase().includes("no tab with id")) {
                     console.log(`[GROUPING_DEBUG] onCreated: Opener tab ${openerIdFromMap} was closed (exception on get 'no tab with id'). No grouping for new tab ${newTab.id}.`);
                } else {
                    console.error(`[GROUPING_DEBUG] onCreated: Error getting opener tab ${openerIdFromMap} for new tab ${newTab.id}:`, e);
                }
            }
        } else {
            console.log(`[GROUPING_DEBUG] onCreated: No openerIdFromMap found for new tab ${newTab.id} (URL: "${urlToCheck}"). No grouping action.`);
        }
    } else {
        console.log(`[GROUPING_DEBUG] onCreated: New tab ${newTab.id} has no openerTabId or urlToCheck is invalid ('${urlToCheck}'). No grouping action.`);
    }
});

async function handleGrouping(openerTab, newTab) {
    console.log(`[GROUPING_DEBUG] handleGrouping: Called for openerTab ${openerTab.id} ("${openerTab.url}", title: "${openerTab.title}") and newTab ${newTab.id}.`);
    const settings = await getSettings();
    console.log(`[GROUPING_DEBUG] handleGrouping: globalGroupingEnabled = ${settings.globalGroupingEnabled}`);
    if (!settings.globalGroupingEnabled || !openerTab?.url) {
        console.log(`[GROUPING_DEBUG] handleGrouping: Exiting early - global grouping disabled or openerTab.url missing.`);
        return;
    }

    const rule = settings.domainRules.find(r => r.enabled && matchesDomain(openerTab.url, r.domainFilter));
    if (!rule) {
        console.log(`[GROUPING_DEBUG] handleGrouping: Exiting early - No matching enabled rule for opener tab URL: ${openerTab.url}`);
        return;
    }
    console.log(`[GROUPING_DEBUG] handleGrouping: Rule found for "${openerTab.url}": name: "${rule.name || 'N/A'}", filter: "${rule.domainFilter}"`);

    // Determine groupName from openerTab's title and rule's regex immediately
    let groupName = "SmartGroup"; // Default group name
    if (openerTab.title && rule.titleParsingRegEx) {
        try {
            const extracted = extractGroupNameFromTitle(openerTab.title, rule.titleParsingRegEx);
            console.log(`[GROUPING_DEBUG] handleGrouping: Group name from OPENER tab - Extracted name: "${extracted}" from opener title "${openerTab.title}" using regex "${rule.titleParsingRegEx}"`);
            if (extracted && extracted.trim()) {
                groupName = extracted.trim();
            } else {
                 console.log(`[GROUPING_DEBUG] handleGrouping: Group name from OPENER tab - Title parsing resulted in empty/null/undefined or whitespace-only. Using default group name "${groupName}".`);
            }
        } catch (e) {
            console.warn(`[GROUPING_DEBUG] handleGrouping: Group name from OPENER tab - Error parsing opener title "${openerTab.title}" with regex "${rule.titleParsingRegEx}". Using default name. Details:`, e.message);
            groupName = "SmartGroup"; // Ensure default on error
        }
    } else {
         console.log(`[GROUPING_DEBUG] handleGrouping: Group name from OPENER tab - No opener title ("${openerTab.title}") or no parsing regex ("${rule.titleParsingRegEx}"). Using default group name "${groupName}".`);
    }
    console.log(`[GROUPING_DEBUG] handleGrouping: Determined groupName (from opener tab): "${groupName}" for new tab ${newTab.id}.`);

    let hasProcessedTab = false;

    chrome.tabs.onUpdated.addListener(async function listener(tabId, changeInfo, tab) {
        if (hasProcessedTab) {
            try { chrome.tabs.onUpdated.removeListener(listener); } catch (e) {}
            return;
        }

        if (tabId === newTab.id) {
            // Log the new tab's title here as it becomes available or changes
            console.log(`[GROUPING_DEBUG] onUpdated listener: Fired for relevant newTab ${tabId}. changeInfo.status: ${changeInfo.status}, newTab.url: ${tab?.url}, newTab.title: "${tab?.title}"`);
        }

        if (tabId === newTab.id && changeInfo.status === 'complete' && tab.url) {
            if (tab.url.startsWith('about:') || tab.url.startsWith('chrome:')) {
                console.log(`[GROUPING_DEBUG] onUpdated listener: New tab ${newTab.id} is 'complete' but URL is '${tab.url}'. Listener remains active, awaiting a more definitive URL.`);
                return;
            }

            hasProcessedTab = true;
            chrome.tabs.onUpdated.removeListener(listener);
            // Note: 'tab' here is the newTab object from the onUpdated event.
            console.log(`[GROUPING_DEBUG] onUpdated listener: Main condition met for newTab ${newTab.id}. URL: "${tab.url}", Title: "${tab.title}". Group name was already determined as "${groupName}". Listener removed.`);

            // GroupName is already determined from openerTab. Now proceed with grouping.
            try {
                let currentOpenerTab = await chrome.tabs.get(openerTab.id); // Refresh openerTab state, though its title for grouping is already used.
                const openerGroupId = currentOpenerTab.groupId;
                console.log(`[GROUPING_DEBUG] handleGrouping: Refreshed openerTab ${currentOpenerTab.id} ("${currentOpenerTab.url}"), current groupId: ${openerGroupId}. Using pre-calculated groupName "${groupName}".`);

                if (openerGroupId === chrome.tabs.TAB_ID_NONE || typeof openerGroupId !== 'number' || openerGroupId <= 0) {
                    console.log(`[GROUPING_DEBUG] handleGrouping: Opener tab ${currentOpenerTab.id} is not in a group. Will check for existing group or create new using groupName "${groupName}".`);
                    const queryParams = { windowId: currentOpenerTab.windowId, title: groupName };
                    console.log(`[GROUPING_DEBUG] handleGrouping: Querying for existing groups with params:`, queryParams);
                    const allGroupsInWindow = await chrome.tabGroups.query(queryParams);
                    console.log(`[GROUPING_DEBUG] handleGrouping: chrome.tabGroups.query found ${allGroupsInWindow.length} groups matching title "${groupName}" with query.`);
                    const existingGroup = allGroupsInWindow.length > 0 ? allGroupsInWindow[0] : null;

                    if (existingGroup) {
                        console.log(`[GROUPING_DEBUG] handleGrouping: Existing group identified: ID ${existingGroup.id}, Title "${existingGroup.title}". Adding tabs.`);
                        const tabsToAddToExistingGroup = [newTab.id];
                        if (currentOpenerTab.groupId !== existingGroup.id) {
                            tabsToAddToExistingGroup.unshift(currentOpenerTab.id);
                        }
                        console.log(`[GROUPING_DEBUG] handleGrouping: Calling chrome.tabs.group to add tabs [${tabsToAddToExistingGroup.join(', ')}] to group ${existingGroup.id}`);
                        await chrome.tabs.group({ groupId: existingGroup.id, tabIds: tabsToAddToExistingGroup });
                        console.log(`[GROUPING_DEBUG] handleGrouping: Calling chrome.tabGroups.update for group ${existingGroup.id} (title: "${groupName}", collapsed: ${rule.collapseExisting})`);
                        await chrome.tabGroups.update(existingGroup.id, { title: groupName, collapsed: rule.collapseExisting });
                    } else {
                        console.log(`[GROUPING_DEBUG] handleGrouping: No group with title "${groupName}" found by query. Creating new group.`);
                        const tabsToGroup = [currentOpenerTab.id, newTab.id];
                        console.log(`[GROUPING_DEBUG] handleGrouping: Calling chrome.tabs.group to create new group with tabs [${tabsToGroup.join(', ')}]`);
                        const newGroupIdVal = await chrome.tabs.group({ tabIds: tabsToGroup });
                        console.log(`[GROUPING_DEBUG] handleGrouping: New group created with temp ID: ${newGroupIdVal}. Calling chrome.tabGroups.update (title: "${groupName}", collapseNew: ${rule.collapseNew})`);
                        await chrome.tabGroups.update(newGroupIdVal, { title: groupName, collapsed: rule.collapseNew });
                        await incrementStat('tabGroupsCreatedCount');
                    }
                } else {
                    console.log(`[GROUPING_DEBUG] handleGrouping: Opener tab ${currentOpenerTab.id} already in group ${openerGroupId}. Adding new tab ${newTab.id}. Using pre-calculated groupName "${groupName}" for consistency if needed (though not for naming this existing group).`);
                    console.log(`[GROUPING_DEBUG] handleGrouping: Calling chrome.tabs.group to add tab ${newTab.id} to group ${openerGroupId}`);
                    await chrome.tabs.group({ groupId: openerGroupId, tabIds: [newTab.id] });
                    console.log(`[GROUPING_DEBUG] handleGrouping: Calling chrome.tabGroups.update for group ${openerGroupId} (collapsed: ${rule.collapseExisting})`);
                    // Title of existing group is not changed here, only collapsed state.
                    await chrome.tabGroups.update(openerGroupId, { collapsed: rule.collapseExisting });
                }
                console.log(`[GROUPING_DEBUG] handleGrouping: Grouping action for new tab ${newTab.id} completed successfully using groupName "${groupName}".`);
            } catch (error) {
                console.error(`[GROUPING_DEBUG] handleGrouping: Error during grouping logic for new tab ${newTab.id} (opener ${openerTab.id}, groupName "${groupName}"):`, error.message, error.stack);
                if (error.message && (error.message.toLowerCase().includes("no tab with id") ||
                                       error.message.toLowerCase().includes("no tab group with id") ||
                                       error.message.toLowerCase().includes("cannot group tab in a closed window") ||
                                       error.message.toLowerCase().includes("invalid tab id"))) {
                    console.warn(`[GROUPING_DEBUG] handleGrouping: The error suggests a tab/group/window was closed or ID was invalid during operation.`);
                }
            }
        } else if (tabId === newTab.id && changeInfo.status !== 'loading') {
             console.log(`[GROUPING_DEBUG] onUpdated listener: Main condition NOT met for newTab ${newTab.id}. changeInfo.status: '${changeInfo.status}', newTab.url: '${tab?.url}', url starts with about/chrome: ${tab?.url?.startsWith('about:') || tab?.url?.startsWith('chrome:')}`);
        }
    });
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId !== 0 || !details.url || details.url.startsWith('about:')) return;
    const settings = await getSettings();
    if (!settings.globalDeduplicationEnabled) return;
    const newUrl = details.url;
    const rule = settings.domainRules.find(r => r.enabled && matchesDomain(newUrl, r.domainFilter));
    const deduplicationActiveForRule = rule ? rule.deduplicationEnabled : settings.globalDeduplicationEnabled;
    if (!deduplicationActiveForRule) return;
    const matchMode = rule ? rule.deduplicationMatchMode : 'exact';
    try {
        const allTabsInWindow = await chrome.tabs.query({ url: "*://*/*", windowId: details.windowId });
        const duplicateTab = allTabsInWindow.find(tab => {
            if (!tab.url || tab.id === details.tabId) return false;
            try {
                const currentTabUrl = new URL(tab.url); const newNavUrl = new URL(newUrl);
                switch (matchMode) {
                    case 'exact': return tab.url === newUrl;
                    case 'hostname_path': return currentTabUrl.hostname === newNavUrl.hostname && currentTabUrl.pathname === newNavUrl.pathname;
                    case 'hostname': return currentTabUrl.hostname === newNavUrl.hostname;
                    case 'includes': return tab.url.includes(newUrl) || newUrl.includes(tab.url);
                    default: return false;
                }
            } catch (urlParseError) { return false; }
        });
        if (duplicateTab) {
            await incrementStat('tabsDeduplicatedCount');
            try { await chrome.tabs.update(duplicateTab.id, { active: true });
                const dupTabWindow = await chrome.windows.get(duplicateTab.windowId, { populate: true });
                if (!dupTabWindow.focused) await chrome.windows.update(duplicateTab.windowId, { focused: true });
            } catch (e) { /* Silently fail focus/update */ }
            try { await chrome.tabs.remove(details.tabId); } catch (e) { /* Silently fail remove */ }
        }
    } catch (queryError) { console.error("Deduplication: Error querying tabs:", queryError); }
}, { url: [{ schemes: ['http', 'https'] }] });

console.log("SmartTab Organizer Service Worker: Group names now derived from opener tab. Logging active.");
