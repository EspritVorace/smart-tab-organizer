// js/background.js
import { getSettings as storageGetSettings, incrementStat, initializeDefaults } from './modules/storage.js';
import { matchesDomain, extractGroupNameFromTitle } from './modules/utils.js';

const middleClickedTabs = new Map();

// Wrapper for getSettings to ensure rules have default collapse properties
async function getSettings() {
    const settings = await storageGetSettings();
    // Ensure domainRules is an array and initialize if undefined
    settings.domainRules = settings.domainRules || [];
    settings.domainRules = settings.domainRules.map(rule => ({
        ...rule,
        collapseNew: typeof rule.collapseNew === 'boolean' ? rule.collapseNew : false,
        collapseExisting: typeof rule.collapseExisting === 'boolean' ? rule.collapseExisting : false,
        deduplicationEnabled: typeof rule.deduplicationEnabled === 'boolean' ? rule.deduplicationEnabled : true, // Default true
        deduplicationMatchMode: rule.deduplicationMatchMode || 'exact' // Default 'exact'
    }));
    return settings;
}

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("SmartTab Organizer installed/updated.", details.reason);
  await initializeDefaults(); // This also calls getSettings and merges, so defaults are applied
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "middleClickLink") {
        if (sender.tab && sender.tab.id) {
            middleClickedTabs.set(request.url, sender.tab.id);
            console.log(`Middle click registered: URL ${request.url} from tab ${sender.tab.id}`);
            sendResponse({ status: "received" });
        } else {
            console.warn("Middle click message received without valid sender.tab.id");
            sendResponse({ status: "error", message: "Missing sender tab ID" });
        }
    }
    return true; // Keep message channel open for asynchronous response
});

chrome.tabs.onCreated.addListener(async (newTab) => {
    if (newTab.openerTabId && (newTab.pendingUrl || newTab.url)) {
        const urlToCheck = newTab.pendingUrl || newTab.url;
        let openerIdFromMap = null;
        let foundDirectMatch = false;

        // Exact match: URL and openerTabId
        if (middleClickedTabs.has(urlToCheck) && middleClickedTabs.get(urlToCheck) === newTab.openerTabId) {
             openerIdFromMap = middleClickedTabs.get(urlToCheck);
             middleClickedTabs.delete(urlToCheck);
             foundDirectMatch = true;
             console.log(`New tab ${newTab.id} (${urlToCheck}) matched directly with opener ${openerIdFromMap}`);
        } else {
            // Fallback: If multiple URLs were opened quickly, the URL might differ slightly or map might not be updated.
            // Check if any URL in the map corresponds to this newTab.openerTabId
            for (const [url, id] of middleClickedTabs.entries()) {
                if (id === newTab.openerTabId) {
                    openerIdFromMap = id;
                    middleClickedTabs.delete(url); // Remove the used entry
                    console.warn(`New tab ${newTab.id} (${urlToCheck}) associated with opener ${openerIdFromMap} via fallback (URL in map was ${url}).`);
                    break;
                }
            }
        }

        if (openerIdFromMap) {
            try {
                // It's crucial to get the latest state of the opener tab, especially its groupId
                const openerTab = await chrome.tabs.get(openerIdFromMap);
                if (openerTab) { // Check if opener tab still exists
                    console.log(`Handling grouping for new tab ${newTab.id}, opener ${openerTab.id} (${openerTab.url})`);
                    handleGrouping(openerTab, newTab);
                } else {
                    console.log(`Opener tab ${openerIdFromMap} not found (likely closed). No grouping for new tab ${newTab.id}.`);
                }
            } catch(e) {
                // Catch errors if chrome.tabs.get fails (e.g., tab closed)
                if (e.message && !e.message.toLowerCase().includes("no tab with id")) {
                    console.error(`Error getting opener tab ${openerIdFromMap} for new tab ${newTab.id}:`, e);
                } else {
                     console.log(`Opener tab ${openerIdFromMap} was closed before grouping could be initiated for new tab ${newTab.id}.`);
                }
            }
        } else {
            console.log(`New tab ${newTab.id} (${urlToCheck}) not associated with a known middle-click opener.`);
        }
    }
});

async function handleGrouping(openerTab, newTab) {
    const settings = await getSettings(); // Ensure settings are fresh, including defaults
    if (!settings.globalGroupingEnabled || !openerTab?.url) {
        console.log(`Grouping skipped: Global grouping disabled (${settings.globalGroupingEnabled}), or openerTab URL missing.`);
        return;
    }

    const rule = settings.domainRules.find(r => r.enabled && matchesDomain(openerTab.url, r.domainFilter));
    if (!rule) {
        console.log(`Grouping skipped: No matching enabled rule for opener tab URL: ${openerTab.url}`);
        return;
    }
    console.log(`Rule found for ${openerTab.url}:`, rule);

    // Wait for the new tab to complete loading and have a title
    chrome.tabs.onUpdated.addListener(async function listener(tabId, changeInfo, tab) {
        if (tabId === newTab.id && changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('about:')) {
            chrome.tabs.onUpdated.removeListener(listener); // Self-remove listener
            console.log(`New tab ${newTab.id} finished loading with URL: ${tab.url} and title: "${tab.title}"`);

            let groupName = "SmartGroup"; // Default group name
            if (tab.title && rule.titleParsingRegEx) {
                try {
                    const extracted = extractGroupNameFromTitle(tab.title, rule.titleParsingRegEx);
                    if (extracted && extracted.trim()) {
                        groupName = extracted.trim();
                    } else if (extracted === "") { // Explicitly empty means use default
                         console.log(`Title parsing regex resulted in empty string for "${tab.title}", using default "${groupName}".`);
                    } else { // Null or undefined from extraction
                        console.log(`Title parsing regex did not extract a name from "${tab.title}", using default "${groupName}".`);
                    }
                } catch (e) {
                    console.warn(`Error parsing title "${tab.title}" with regex "${rule.titleParsingRegEx}". Using default name.`, e);
                }
            } else {
                 console.log(`No title or no parsing regex for tab ${newTab.id}, using default group name "${groupName}".`);
            }

            console.log(`Determined group name: "${groupName}" for new tab ${newTab.id}. Opener tab ID: ${openerTab.id}.`);

            try {
                // Refresh openerTab state, especially its groupId, as it might have been grouped by another concurrent operation.
                let currentOpenerTab = await chrome.tabs.get(openerTab.id);
                const openerGroupId = currentOpenerTab.groupId;

                if (openerGroupId === chrome.tabs.TAB_ID_NONE || typeof openerGroupId !== 'number' || openerGroupId <= 0) {
                    // Opener tab is not in a group. Check for existing group or create new.
                    console.log(`Opener tab ${currentOpenerTab.id} is not in a group. Checking for existing group or creating new for "${groupName}".`);
                    const allGroupsInWindow = await chrome.tabGroups.query({ windowId: currentOpenerTab.windowId, title: groupName });
                    const existingGroup = allGroupsInWindow.find(g => g.title === groupName); // Case-sensitive check

                    if (existingGroup) {
                        console.log(`Found existing group "${groupName}" (ID: ${existingGroup.id}) in window ${currentOpenerTab.windowId}.`);
                        const tabsToAddToExistingGroup = [newTab.id];
                        if (currentOpenerTab.groupId !== existingGroup.id) { // Add opener only if not already in this specific group
                            tabsToAddToExistingGroup.unshift(currentOpenerTab.id);
                        }
                        await chrome.tabs.group({ groupId: existingGroup.id, tabIds: tabsToAddToExistingGroup });
                        await chrome.tabGroups.update(existingGroup.id, { collapsed: rule.collapseExisting });
                        console.log(`Tabs (${tabsToAddToExistingGroup.join(', ')}) added to existing group "${groupName}" (ID: ${existingGroup.id}). Collapsed: ${rule.collapseExisting}`);
                    } else {
                        console.log(`No existing group named "${groupName}" in window ${currentOpenerTab.windowId}. Creating new group.`);
                        const newGroupId = await chrome.tabs.group({ tabIds: [currentOpenerTab.id, newTab.id], windowId: currentOpenerTab.windowId });
                        await chrome.tabGroups.update(newGroupId, { title: groupName, collapsed: rule.collapseNew });
                        await incrementStat('tabGroupsCreatedCount');
                        console.log(`New group "${groupName}" (ID: ${newGroupId}) created with tabs ${currentOpenerTab.id}, ${newTab.id}. Collapsed: ${rule.collapseNew}`);
                    }
                } else {
                    // Opener tab is already in a group. Add new tab to this group.
                    console.log(`Opener tab ${currentOpenerTab.id} is already in group ${openerGroupId}. Adding new tab ${newTab.id}.`);
                    await chrome.tabs.group({ groupId: openerGroupId, tabIds: [newTab.id] });
                    await chrome.tabGroups.update(openerGroupId, { collapsed: rule.collapseExisting }); // Apply rule for existing group
                    console.log(`Tab ${newTab.id} added to opener's group ${openerGroupId}. Collapsed: ${rule.collapseExisting}`);
                }
            } catch (error) {
                // Handle cases where tabs or groups might have been closed/removed during async operations
                if (error.message && (error.message.toLowerCase().includes("no tab with id") ||
                                       error.message.toLowerCase().includes("no tab group with id") ||
                                       error.message.toLowerCase().includes("cannot group tab in a closed window"))) {
                    console.warn(`Grouping for tab ${newTab.id} failed as tab/group/window was closed: ${error.message}`);
                } else {
                    console.error(`Error in grouping logic for new tab ${newTab.id} and opener ${openerTab.id}:`, error, `Group name: "${groupName}"`);
                }
            }
        }
    });
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId !== 0 || !details.url || details.url.startsWith('about:')) return;

    const settings = await getSettings();
    if (!settings.globalDeduplicationEnabled) return;

    const newUrl = details.url;
    const rule = settings.domainRules.find(r => r.enabled && matchesDomain(newUrl, r.domainFilter));

    // Use rule-specific deduplicationEnabled, falling back to global if rule doesn't specify
    const deduplicationActiveForRule = rule ? rule.deduplicationEnabled : settings.globalDeduplicationEnabled;
    if (!deduplicationActiveForRule) {
        console.log(`Deduplication skipped for ${newUrl}: rule disabled or no rule and global disabled.`);
        return;
    }

    // Use rule-specific match mode, or default if not set in rule
    const matchMode = rule ? rule.deduplicationMatchMode : 'exact';
    console.log(`Deduplication check for ${newUrl} with mode: ${matchMode}`);

    try {
        const allTabsInWindow = await chrome.tabs.query({ url: "*://*/*", windowId: details.windowId });
        const duplicateTab = allTabsInWindow.find(tab => {
            if (!tab.url || tab.id === details.tabId) return false; // Skip self or tabs without URL

            try {
                const currentTabUrl = new URL(tab.url);
                const newNavUrl = new URL(newUrl);

                switch (matchMode) {
                    case 'exact':
                        return tab.url === newUrl;
                    case 'hostname_path': // Compare hostname and pathname, ignore query params and hash
                        return currentTabUrl.hostname === newNavUrl.hostname && currentTabUrl.pathname === newNavUrl.pathname;
                    case 'hostname': // Compare only hostname
                        return currentTabUrl.hostname === newNavUrl.hostname;
                    // 'includes' is intentionally less strict and might be removed or refined if too broad.
                    // For now, keeping its original behavior for compatibility if someone used it.
                    case 'includes':
                        return tab.url.includes(newUrl) || newUrl.includes(tab.url);
                    default:
                        return false;
                }
            } catch (urlParseError) {
                console.warn(`Could not parse URL for deduplication comparison: ${tab.url} or ${newUrl}`, urlParseError);
                return false;
            }
        });

        if (duplicateTab) {
            console.log(`Deduplication: Found duplicate tab (ID: ${duplicateTab.id}, URL: ${duplicateTab.url}) for navigation to ${newUrl}. Activating and removing new tab ${details.tabId}.`);
            await incrementStat('tabsDeduplicatedCount');
            try {
                await chrome.tabs.update(duplicateTab.id, { active: true });
                const dupTabWindow = await chrome.windows.get(duplicateTab.windowId, { populate: true }); // populate to check focus
                if (!dupTabWindow.focused) {
                    await chrome.windows.update(duplicateTab.windowId, { focused: true });
                }
            } catch (e) {
                if (!e.message?.toLowerCase().includes("no tab with id") && !e.message?.toLowerCase().includes("no window with id")) {
                    console.warn("Deduplication: Error focusing duplicate tab's window:", e);
                }
            }
            try {
                await chrome.tabs.remove(details.tabId);
                console.log(`Deduplication: Removed new tab (ID: ${details.tabId}).`);
            } catch (e) {
                if (!e.message?.toLowerCase().includes("no tab with id")) {
                    console.warn("Deduplication: Error closing the new tab that was a duplicate:", e);
                }
            }
        }
    } catch (queryError) {
         console.error("Deduplication: Error querying tabs:", queryError);
    }
}, { url: [{ schemes: ['http', 'https'] }] });

console.log("SmartTab Organizer Service Worker started. Grouping logic updated.");
