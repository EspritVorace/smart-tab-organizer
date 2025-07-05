import { browser, Browser } from 'wxt/browser';
import { incrementStat } from '../utils/statisticsUtils.js';
import { matchesDomain, extractGroupNameFromTitle, extractGroupNameFromUrl } from '../utils/utils.js';
import { getSettings } from './settings.js';
import { promptForGroupName } from './messaging.js';
import type { DomainRuleSetting } from '../types/syncSettings.js';

export interface GroupingContext {
    rule: DomainRuleSetting;
    groupName: string;
    groupColor: string | null;
    openerTab: Browser.tabs.Tab;
    newTab: Browser.tabs.Tab;
}

export function findMatchingRule(url: string, domainRules: DomainRuleSetting[]): DomainRuleSetting | undefined {
    return domainRules.find(r => r.enabled && matchesDomain(url, r.domainFilter));
}

export function determineGroupColor(rule: DomainRuleSetting, settings: any): string | null {
    if (!rule.groupId || !settings.logicalGroups || settings.logicalGroups.length === 0) {
        return null;
    }
    
    const logicalGroup = settings.logicalGroups.find(lg => lg.id === rule.groupId);
    if (logicalGroup && logicalGroup.color) {
        console.log(`[GROUPING_DEBUG] Logical group found: ID "${logicalGroup.id}", Label "${logicalGroup.label}", Color "${logicalGroup.color}".`);
        return logicalGroup.color;
    }
    
    console.log(`[GROUPING_DEBUG] Rule has groupId "${rule.groupId}" but no matching logical group or color found.`);
    return null;
}

export function extractGroupNameFromRule(rule: DomainRuleSetting, openerTab: Browser.tabs.Tab): string {
    let groupName = rule.label || "SmartGroup";
    
    if (rule.groupNameSource === 'title' && openerTab.title && rule.titleParsingRegEx) {
        try {
            const extracted = extractGroupNameFromTitle(openerTab.title, rule.titleParsingRegEx);
            if (extracted && extracted.trim()) {
                groupName = extracted.trim();
                console.log(`[GROUPING_DEBUG] Group name extracted from opener title "${openerTab.title}" using regex "${rule.titleParsingRegEx}": "${groupName}".`);
            }
        } catch (e) {
            console.warn(`[GROUPING_DEBUG] Error parsing opener title "${openerTab.title}" with regex "${rule.titleParsingRegEx}".`, e.message);
        }
    } else if (rule.groupNameSource === 'url' && openerTab.url && rule.urlParsingRegEx) {
        try {
            const extracted = extractGroupNameFromUrl(openerTab.url, rule.urlParsingRegEx);
            if (extracted && extracted.trim()) {
                groupName = extracted.trim();
                console.log(`[GROUPING_DEBUG] Group name extracted from opener URL "${openerTab.url}" using regex "${rule.urlParsingRegEx}": "${groupName}".`);
            }
        } catch (e) {
            console.warn(`[GROUPING_DEBUG] Error parsing opener URL "${openerTab.url}" with regex "${rule.urlParsingRegEx}".`, e.message);
        }
    }
    
    return groupName;
}

export function createGroupingContext(
    rule: DomainRuleSetting, 
    openerTab: Browser.tabs.Tab, 
    newTab: Browser.tabs.Tab, 
    settings: any
): GroupingContext {
    const groupName = extractGroupNameFromRule(rule, openerTab);
    const groupColor = determineGroupColor(rule, settings);
    
    return {
        rule,
        groupName,
        groupColor,
        openerTab,
        newTab
    };
}

export async function createNewGroup(
    tabsToGroup: number[], 
    groupName: string, 
    groupColor: string | null
): Promise<number> {
    console.log(`[GROUPING_DEBUG] Calling browser.tabs.group to create new group with tabs [${tabsToGroup.join(', ')}]`);
    const newGroupId = await browser.tabs.group({ tabIds: tabsToGroup });
    
    const updatePayload: any = { title: groupName, collapsed: false };
    if (groupColor) updatePayload.color = groupColor;
    
    console.log(`[GROUPING_DEBUG] New group created with ID: ${newGroupId}. Calling browser.tabGroups.update with payload:`, updatePayload);
    await browser.tabGroups.update(newGroupId, updatePayload);
    await incrementStat('tabGroupsCreatedCount');
    
    return newGroupId;
}

export async function addToExistingGroup(
    groupId: number, 
    tabId: number
): Promise<void> {
    console.log(`[GROUPING_DEBUG] Adding tab ${tabId} to existing group ${groupId}`);
    await browser.tabs.group({ groupId: groupId, tabIds: [tabId] });
    
    const updatePayload: any = { collapsed: false };
    console.log(`[GROUPING_DEBUG] Updating group ${groupId} with payload:`, updatePayload);
    await browser.tabGroups.update(groupId, updatePayload);
}

export async function handleManualGroupNaming(
    rule: DomainRuleSetting,
    targetGroupId: number,
    groupName: string,
    groupedTabIds: number[],
    openerTabId: number
): Promise<void> {
    if (rule.groupNameSource !== 'manual' || !targetGroupId) {
        return;
    }
    
    const manualName = await promptForGroupName(groupName, openerTabId);
    if (manualName && manualName !== groupName) {
        await browser.tabGroups.update(targetGroupId, { title: manualName });
        console.log(`[GROUPING_DEBUG] Group ${targetGroupId} renamed manually to "${manualName}".`);
    } else if (manualName === null) {
        try {
            await browser.tabs.ungroup(groupedTabIds);
            console.log(`[GROUPING_DEBUG] Manual prompt cancelled. Ungrouped tabs ${groupedTabIds.join(', ')} from group ${targetGroupId}.`);
        } catch (ungroupErr) {
            console.error('[GROUPING_DEBUG] Failed to ungroup after manual cancel', ungroupErr);
        }
    }
}

export async function performGroupingOperation(context: GroupingContext): Promise<{targetGroupId: number, groupedTabIds: number[]}> {
    const currentOpenerTab = await browser.tabs.get(context.openerTab.id);
    const openerGroupId = currentOpenerTab.groupId;
    
    console.log(`[GROUPING_DEBUG] Refreshed openerTab ${currentOpenerTab.id} ("${currentOpenerTab.url}"), current groupId: ${openerGroupId}. Using groupName "${context.groupName}".`);

    let targetGroupId: number;
    let groupedTabIds: number[];

    if (openerGroupId === browser.tabs.TAB_ID_NONE || typeof openerGroupId !== 'number' || openerGroupId <= 0) {
        console.log(`[GROUPING_DEBUG] Opener tab ${currentOpenerTab.id} is not in a group. Creating new group.`);
        const tabsToGroup = [currentOpenerTab.id, context.newTab.id];
        groupedTabIds = tabsToGroup.slice();
        targetGroupId = await createNewGroup(tabsToGroup, context.groupName, context.groupColor);
    } else {
        console.log(`[GROUPING_DEBUG] Opener tab ${currentOpenerTab.id} already in group ${openerGroupId}.`);
        targetGroupId = openerGroupId;
        groupedTabIds = [context.newTab.id];
        await addToExistingGroup(openerGroupId, context.newTab.id);
    }

    return { targetGroupId, groupedTabIds };
}

export async function processGroupingForNewTab(openerTab: Browser.tabs.Tab, newTab: Browser.tabs.Tab): Promise<void> {
    console.log(`[GROUPING_DEBUG] Processing grouping for openerTab ${openerTab.id} and newTab ${newTab.id}.`);
    
    const settings = await getSettings();
    if (!settings.globalGroupingEnabled || !openerTab?.url) {
        console.log(`[GROUPING_DEBUG] Grouping disabled or opener URL missing.`);
        return;
    }

    const rule = findMatchingRule(openerTab.url, settings.domainRules);
    if (!rule) {
        console.log(`[GROUPING_DEBUG] No matching rule for opener tab URL: ${openerTab.url}`);
        return;
    }

    const context = createGroupingContext(rule, openerTab, newTab, settings);
    console.log(`[GROUPING_DEBUG] Rule found: "${rule.label}", groupName: "${context.groupName}"`);

    try {
        const { targetGroupId, groupedTabIds } = await performGroupingOperation(context);
        console.log(`[GROUPING_DEBUG] Grouping completed for new tab ${newTab.id}. Color: ${context.groupColor || 'Chrome default'}.`);
        
        await handleManualGroupNaming(rule, targetGroupId, context.groupName, groupedTabIds, openerTab.id);
    } catch (error) {
        console.error(`[GROUPING_DEBUG] Error during grouping for new tab ${newTab.id}:`, error);
        if (error.message && (
            error.message.toLowerCase().includes("no tab with id") ||
            error.message.toLowerCase().includes("no tab group with id") ||
            error.message.toLowerCase().includes("cannot group tab in a closed window") ||
            error.message.toLowerCase().includes("invalid tab id")
        )) {
            console.warn(`[GROUPING_DEBUG] The error suggests a tab/group/window was closed or ID was invalid during operation.`);
        }
    }
}