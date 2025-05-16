// js/background.js
import { getSettings, incrementStat, initializeDefaults } from './modules/storage.js';
import { matchesDomain, extractGroupNameFromTitle } from './modules/utils.js';

const middleClickedTabs = new Map();

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("SmartTab Organizer installed/updated.", details.reason);
  await initializeDefaults();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "middleClickLink") {
        middleClickedTabs.set(request.url, sender.tab.id);
        sendResponse({ status: "received" });
    }
    return false;
});

chrome.tabs.onCreated.addListener(async (newTab) => {
    if (newTab.openerTabId && (newTab.pendingUrl || newTab.url)) {
        const urlToCheck = newTab.pendingUrl || newTab.url;
        let openerId = null;

        if (middleClickedTabs.has(urlToCheck) && middleClickedTabs.get(urlToCheck) === newTab.openerTabId) {
             openerId = middleClickedTabs.get(urlToCheck);
             middleClickedTabs.delete(urlToCheck);
        } else {
            // Fallback: Check if any URL maps to this openerId (less precise)
            for (const [url, id] of middleClickedTabs.entries()) {
                if (id === newTab.openerTabId) {
                    openerId = id;
                    middleClickedTabs.delete(url);
                    console.warn("Assoc. par OpenerID seul pour", urlToCheck);
                    break;
                }
            }
        }

        if (openerId) {
            try {
                const openerTab = await chrome.tabs.get(openerId);
                handleGrouping(openerTab, newTab);
            } catch(e) { console.error("Err get opener tab:", e); }
        }
    }
});

async function handleGrouping(openerTab, newTab) {
    const settings = await getSettings();
    if (!settings.globalGroupingEnabled || !openerTab?.url) return;
    const rule = settings.domainRules.find(r => r.enabled && matchesDomain(openerTab.url, r.domainFilter));
    if (!rule) return;

    chrome.tabs.onUpdated.addListener(async function listener(tabId, changeInfo, tab) {
        if (tabId === newTab.id && changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('about:')) {
            chrome.tabs.onUpdated.removeListener(listener);
            let groupName = "SmartGroup";
            if (tab.title && rule.titleParsingRegEx) {
                const extracted = extractGroupNameFromTitle(tab.title, rule.titleParsingRegEx);
                if (extracted) groupName = extracted;
            }
            let targetGroupId = openerTab.groupId;
            try {
                if (targetGroupId <= 0) {
                    targetGroupId = await chrome.tabs.group({ tabIds: [openerTab.id, newTab.id] });
                    await chrome.tabGroups.update(targetGroupId, { title: groupName, collapsed: false });
                    await incrementStat('tabGroupsCreatedCount');
                } else {
                    await chrome.tabs.group({ groupId: targetGroupId, tabIds: [newTab.id] });
                }
            } catch (error) { console.error("Err regroupement:", error); }
        }
    });
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId !== 0 || !details.url || details.url.startsWith('about:')) return;

    const settings = await getSettings();
    if (!settings.globalDeduplicationEnabled) return;
    const newUrl = details.url;
    const rule = settings.domainRules.find(r => r.enabled && matchesDomain(newUrl, r.domainFilter));
    if (!rule) return;

    const allTabs = await chrome.tabs.query({ url: "*://*/*" });
    const duplicateTab = allTabs.find(tab =>
        tab.url && tab.id !== details.tabId &&
        ( (rule.deduplicationMatchMode === 'exact' && tab.url === newUrl) ||
          (rule.deduplicationMatchMode === 'includes' && (tab.url.includes(newUrl) || newUrl.includes(tab.url))) )
    );

    if (duplicateTab) {
        await incrementStat('tabsDeduplicatedCount');
        try {
            await chrome.tabs.update(duplicateTab.id, { active: true });
            await chrome.windows.update(duplicateTab.windowId, { focused: true });
            await chrome.tabs.reload(duplicateTab.id);
        } catch(e) { console.error("Err focus/reload doublon:", e); }
        try { await chrome.tabs.remove(details.tabId); }
        catch(e) { console.warn("Err fermeture onglet doublon:", e); }
    }
}, { url: [{ schemes: ['http', 'https'] }] });

console.log("SmartTab Organizer Service Worker démarré.");