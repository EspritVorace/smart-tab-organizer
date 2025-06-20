// js/background.js
import browser from 'webextension-polyfill';
import { getSettings as storageGetSettings, incrementStat, initializeDefaults } from '../modules/storage.js';
import { matchesDomain, extractGroupNameFromTitle, extractGroupNameFromUrl } from '../modules/utils.js';

const middleClickedTabs = new Map();

async function getSettings() {
    const settings = await storageGetSettings();
    settings.domainRules = settings.domainRules || [];
    settings.domainRules = settings.domainRules.map(rule => ({
        ...rule,
        collapseNew: typeof rule.collapseNew === 'boolean' ? rule.collapseNew : false,
        collapseExisting: typeof rule.collapseExisting === 'boolean' ? rule.collapseExisting : false,
        deduplicationEnabled: typeof rule.deduplicationEnabled === 'boolean' ? rule.deduplicationEnabled : true,
        deduplicationMatchMode: rule.deduplicationMatchMode || 'exact',
        groupNameSource: rule.groupNameSource || 'title',
        urlParsingRegEx: rule.urlParsingRegEx || ''
    }));
    return settings;
}

async function promptForGroupName(defaultName, tabId) {
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

browser.runtime.onInstalled.addListener(async (details) => {
  console.log("SmartTab Organizer installed/updated.", details.reason);
  await initializeDefaults();
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
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

browser.tabs.onCreated.addListener(async (newTab) => {
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
                const openerTab = await browser.tabs.get(openerIdFromMap);
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
    // rule.label is available from settings, rule.name was from an older version.
    console.log(`[GROUPING_DEBUG] handleGrouping: Rule found for "${openerTab.url}": label: "${rule.label || 'N/A'}", filter: "${rule.domainFilter}", groupId: "${rule.groupId}"`);

    // Determine groupColor from logical group
    let groupColor = null; // Default to no color (Chrome default)
    if (rule.groupId && settings.logicalGroups && settings.logicalGroups.length > 0) {
        const logicalGroup = settings.logicalGroups.find(lg => lg.id === rule.groupId);
        if (logicalGroup && logicalGroup.color) {
            groupColor = logicalGroup.color;
            console.log(`[GROUPING_DEBUG] handleGrouping: Logical group found: ID "${logicalGroup.id}", Label "${logicalGroup.label}", Color "${groupColor}".`);
        } else {
            console.log(`[GROUPING_DEBUG] handleGrouping: Rule has groupId "${rule.groupId}" but no matching logical group or color found.`);
        }
    } else {
        console.log(`[GROUPING_DEBUG] handleGrouping: Rule has no groupId, or no logicalGroups in settings. No specific color will be applied.`);
    }

    // Determine groupName synchronously. If groupNameSource is 'manual', we will
    // use this placeholder name for grouping and rename the group after
    // creation once the user provides a name.
    let groupName = rule.label;
    if (!groupName || !groupName.trim()) {
        groupName = "SmartGroup";
        console.log(`[GROUPING_DEBUG] handleGrouping: Rule label is empty or whitespace. Initial groupName set to "${groupName}".`);
    } else {
        console.log(`[GROUPING_DEBUG] handleGrouping: Initial groupName set from rule.label: "${groupName}".`);
    }

    if (rule.groupNameSource === 'title' && openerTab.title && rule.titleParsingRegEx) {
        try {
            const extracted = extractGroupNameFromTitle(openerTab.title, rule.titleParsingRegEx);
            if (extracted && extracted.trim()) {
                groupName = extracted.trim();
                console.log(`[GROUPING_DEBUG] handleGrouping: Group name extracted from opener title "${openerTab.title}" using regex "${rule.titleParsingRegEx}": "${groupName}".`);
            }
        } catch (e) {
            console.warn(`[GROUPING_DEBUG] handleGrouping: Error parsing opener title "${openerTab.title}" with regex "${rule.titleParsingRegEx}".`, e.message);
        }
    } else if (rule.groupNameSource === 'url' && openerTab.url && rule.urlParsingRegEx) {
        try {
            const extracted = extractGroupNameFromUrl(openerTab.url, rule.urlParsingRegEx);
            if (extracted && extracted.trim()) {
                groupName = extracted.trim();
                console.log(`[GROUPING_DEBUG] handleGrouping: Group name extracted from opener URL "${openerTab.url}" using regex "${rule.urlParsingRegEx}": "${groupName}".`);
            }
        } catch (e) {
            console.warn(`[GROUPING_DEBUG] handleGrouping: Error parsing opener URL "${openerTab.url}" with regex "${rule.urlParsingRegEx}".`, e.message);
        }
    }

    console.log(`[GROUPING_DEBUG] handleGrouping: Initial/fallback groupName resolved to "${groupName}" for new tab ${newTab.id}.`);

    let hasProcessedTab = false;
    let targetGroupId = null;
    let groupedTabIds = [];

    browser.tabs.onUpdated.addListener(async function listener(tabId, changeInfo, tab) {
        if (hasProcessedTab) {
            try { browser.tabs.onUpdated.removeListener(listener); } catch (e) {}
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
            browser.tabs.onUpdated.removeListener(listener);
            // Note: 'tab' here is the newTab object from the onUpdated event.
            console.log(`[GROUPING_DEBUG] onUpdated listener: Main condition met for newTab ${newTab.id}. URL: "${tab.url}", Title: "${tab.title}". Placeholder group name "${groupName}". Listener removed.`);

            // GroupName is already determined from openerTab. Now proceed with grouping.
            try {
                let currentOpenerTab = await browser.tabs.get(openerTab.id); // Refresh openerTab state
                const openerGroupId = currentOpenerTab.groupId;
                console.log(`[GROUPING_DEBUG] handleGrouping: Refreshed openerTab ${currentOpenerTab.id} ("${currentOpenerTab.url}"), current groupId: ${openerGroupId}. Using groupName "${groupName}".`);

                if (openerGroupId === browser.tabs.TAB_ID_NONE || typeof openerGroupId !== 'number' || openerGroupId <= 0) {
                    console.log(`[GROUPING_DEBUG] handleGrouping: Opener tab ${currentOpenerTab.id} is not in a group. Will create new group using groupName "${groupName}".`);
                    const tabsToGroup = [currentOpenerTab.id, newTab.id];
                    groupedTabIds = tabsToGroup.slice();
                    console.log(`[GROUPING_DEBUG] handleGrouping: Calling browser.tabs.group to create new group with tabs [${tabsToGroup.join(', ')}]`);
                    const newGroupIdVal = await browser.tabs.group({ tabIds: tabsToGroup });
                    targetGroupId = newGroupIdVal;
                    const updatePayloadNew = { title: groupName, collapsed: rule.collapseNew };
                    if (groupColor) updatePayloadNew.color = groupColor;
                    console.log(`[GROUPING_DEBUG] handleGrouping: New group created with temp ID: ${newGroupIdVal}. Calling browser.tabGroups.update with payload:`, updatePayloadNew);
                    await browser.tabGroups.update(newGroupIdVal, updatePayloadNew);
                    await incrementStat('tabGroupsCreatedCount');
                } else {
                    targetGroupId = openerGroupId;
                    console.log(`[GROUPING_DEBUG] handleGrouping: Opener tab ${currentOpenerTab.id} already in group ${openerGroupId}. Adding new tab ${newTab.id}. Using groupName "${groupName}" for consistency if needed (though not for naming this existing group).`);
                    console.log(`[GROUPING_DEBUG] handleGrouping: Calling browser.tabs.group to add tab ${newTab.id} to group ${openerGroupId}`);
                    await browser.tabs.group({ groupId: openerGroupId, tabIds: [newTab.id] });
                    groupedTabIds = [newTab.id];
                    // For existing groups where opener was already part, we might only want to set collapsed state,
                    // and potentially color if the group doesn't have the "right" color yet.
                    // However, changing color of an existing group the user might have manually set could be intrusive.
                    // For now, let's only set collapsed state and not color for groups the opener was already in.
                    // If the group's color needs to be updated to match the rule, it should happen when the group is first formed or if it's re-evaluated.
                    // The current logic for "existingGroup" (found by title) DOES set the color.
                    // This path is for when openerTab is ALREADY in a group.
                    const updatePayloadOpenerInGroup = { collapsed: rule.collapseExisting };
                    // Re-fetch the group to check its current color, only update if different from rule's color?
                    // Or, more simply, if the rule implies a color, and the group doesn't have it, apply it.
                    // This could still be intrusive. For now, let's be conservative for groups opener is already in.
                    // const existingGroupDetails = await browser.tabGroups.get(openerGroupId);
                    // if (groupColor && existingGroupDetails.color !== groupColor) {
                    //    updatePayloadOpenerInGroup.color = groupColor; // This line makes it more aggressive in coloring
                    // }
                    console.log(`[GROUPING_DEBUG] handleGrouping: Calling browser.tabGroups.update for group ${openerGroupId} with payload:`, updatePayloadOpenerInGroup);
                    await browser.tabGroups.update(openerGroupId, updatePayloadOpenerInGroup);
                }
                console.log(`[GROUPING_DEBUG] handleGrouping: Grouping action for new tab ${newTab.id} completed successfully using groupName "${groupName}". Color applied: ${groupColor || 'Chrome default'}.`);

                if (rule.groupNameSource === 'manual' && targetGroupId) {
                    const manualName = await promptForGroupName(groupName, openerTab.id);
                    if (manualName && manualName !== groupName) {
                        await browser.tabGroups.update(targetGroupId, { title: manualName });
                        console.log(`[GROUPING_DEBUG] handleGrouping: Group ${targetGroupId} renamed manually to "${manualName}".`);
                    } else if (manualName === null) {
                        try {
                            await browser.tabs.ungroup(groupedTabIds);
                            console.log(`[GROUPING_DEBUG] handleGrouping: Manual prompt cancelled. Ungrouped tabs ${groupedTabIds.join(', ')} from group ${targetGroupId}.`);
                        } catch (ungroupErr) {
                            console.error('[GROUPING_DEBUG] handleGrouping: Failed to ungroup after manual cancel', ungroupErr);
                        }
                    }
                }
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

// Remplace ta section webNavigation par ceci :

// Map pour éviter de traiter plusieurs fois le même onglet
const processedTabs = new Set();

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // On s'intéresse aux changements d'URL ou aux onglets qui finissent de charger
    const urlToCheck = changeInfo.url || (changeInfo.status === 'complete' ? tab.url : null);
    
    if (!urlToCheck || 
        urlToCheck.startsWith('about:') || 
        urlToCheck.startsWith('chrome:') ||
        processedTabs.has(`${tabId}-${urlToCheck}`)) {
        return;
    }

    // Marquer comme traité pour éviter les doublons
    processedTabs.add(`${tabId}-${urlToCheck}`);
    
    const settings = await getSettings();
    if (!settings.globalDeduplicationEnabled) return;

    const rule = settings.domainRules.find(r => r.enabled && matchesDomain(urlToCheck, r.domainFilter));
    const deduplicationActiveForRule = rule ? rule.deduplicationEnabled : settings.globalDeduplicationEnabled;
    if (!deduplicationActiveForRule) return;

    const matchMode = rule ? rule.deduplicationMatchMode : 'exact';
    
    try {
        await checkAndDeduplicateTab(tabId, urlToCheck, matchMode, tab.windowId);
    } catch (error) {
        console.error("Deduplication error:", error);
    }
});

async function checkAndDeduplicateTab(currentTabId, newUrl, matchMode, windowId) {
    try {
        const allTabsInWindow = await browser.tabs.query({ 
            url: "*://*/*", 
            windowId: windowId 
        });
        
        const duplicateTab = allTabsInWindow.find(tab => {
            if (!tab.url || tab.id === currentTabId) return false;
            
            try {
                const currentTabUrl = new URL(tab.url);
                const newNavUrl = new URL(newUrl);
                
                switch (matchMode) {
                    case 'exact': 
                        return tab.url === newUrl;
                    case 'hostname_path': 
                        return currentTabUrl.hostname === newNavUrl.hostname && 
                               currentTabUrl.pathname === newNavUrl.pathname;
                    case 'hostname': 
                        return currentTabUrl.hostname === newNavUrl.hostname;
                    case 'includes': 
                        return tab.url.includes(newUrl) || newUrl.includes(tab.url);
                    default: 
                        return false;
                }
            } catch (urlParseError) { 
                return false; 
            }
        });

        if (duplicateTab) {
            console.log(`[DEDUPLICATION] Duplicate found: ${newUrl} (keeping tab ${duplicateTab.id}, removing ${currentTabId})`);
            
            await incrementStat('tabsDeduplicatedCount');
            
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
            
            // Supprimer l'onglet dupliqué
            try { 
                await browser.tabs.remove(currentTabId); 
            } catch (e) { 
                console.warn("Could not remove duplicate tab:", e);
            }
        }
    } catch (queryError) { 
        console.error("Deduplication: Error querying tabs:", queryError); 
    }
}

// Nettoyage périodique du cache pour éviter l'accumulation
setInterval(() => {
    processedTabs.clear();
}, 5 * 60 * 1000); // Nettoie toutes les 5 minutes

console.log("SmartTab Organizer Service Worker: Group names now derived from opener tab. Logging active.");
