import { browser, Browser } from 'wxt/browser';
import { incrementStat } from '@/utils/statisticsUtils.js';
import { matchesDomain, extractGroupNameFromTitle, extractGroupNameFromUrl } from '@/utils/utils';
import { getSettings } from './settings.js';
import { promptForGroupName } from './messaging.js';
import { showNotification, type UndoAction } from '@/utils/notifications.js';
import { getMessage } from '@/utils/i18n.js';
import type { DomainRuleSetting, SyncSettings } from '@/types/syncSettings.js';
import { getRuleCategory } from '@/schemas/enums.js';
import { logger } from '@/utils/logger.js';

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

export function determineGroupColor(rule: DomainRuleSetting, settings?: any): string | null {
    const category = getRuleCategory(rule.categoryId);
    if (category) {
        logger.debug(`[GROUPING_DEBUG] Using category "${rule.categoryId}" color: "${category.color}".`);
        return category.color;
    }
    if (rule.color) {
        logger.debug(`[GROUPING_DEBUG] Using legacy rule color: "${rule.color}".`);
        return rule.color;
    }
    logger.debug(`[GROUPING_DEBUG] Rule has no category or color defined.`);
    return null;
}

export function extractGroupNameFromRule(rule: DomainRuleSetting, openerTab: Browser.tabs.Tab): string | null {
    let groupName = rule.label || "SmartGroup";

    if (rule.groupNameSource === 'title') {
        // Essaie le titre en priorité, puis l'URL si le titre ne donne rien
        let extracted: string | null = null;
        if (openerTab.title && rule.titleParsingRegEx) {
            try {
                extracted = extractGroupNameFromTitle(openerTab.title, rule.titleParsingRegEx);
                if (extracted?.trim()) logger.debug(`[GROUPING_DEBUG] Group name extracted from opener title "${openerTab.title}" using regex "${rule.titleParsingRegEx}": "${extracted.trim()}".`);
            } catch (e) {
                logger.warn(`[GROUPING_DEBUG] Error parsing opener title "${openerTab.title}" with regex "${rule.titleParsingRegEx}".`, e.message);
            }
        }
        if (!extracted?.trim() && openerTab.url && rule.urlParsingRegEx) {
            try {
                extracted = extractGroupNameFromUrl(openerTab.url, rule.urlParsingRegEx);
                if (extracted?.trim()) logger.debug(`[GROUPING_DEBUG] Group name extracted from opener URL "${openerTab.url}" using regex "${rule.urlParsingRegEx}" (title fallback): "${extracted.trim()}".`);
            } catch (e) {
                logger.warn(`[GROUPING_DEBUG] Error parsing opener URL "${openerTab.url}" with regex "${rule.urlParsingRegEx}".`, e.message);
            }
        }
        if (extracted?.trim()) {
            groupName = extracted.trim();
        } else {
            return null;
        }
    } else if (rule.groupNameSource === 'url') {
        // Essaie l'URL en priorité, puis le titre si l'URL ne donne rien
        let extracted: string | null = null;
        if (openerTab.url && rule.urlParsingRegEx) {
            try {
                extracted = extractGroupNameFromUrl(openerTab.url, rule.urlParsingRegEx);
                if (extracted?.trim()) logger.debug(`[GROUPING_DEBUG] Group name extracted from opener URL "${openerTab.url}" using regex "${rule.urlParsingRegEx}": "${extracted.trim()}".`);
            } catch (e) {
                logger.warn(`[GROUPING_DEBUG] Error parsing opener URL "${openerTab.url}" with regex "${rule.urlParsingRegEx}".`, e.message);
            }
        }
        if (!extracted?.trim() && openerTab.title && rule.titleParsingRegEx) {
            try {
                extracted = extractGroupNameFromTitle(openerTab.title, rule.titleParsingRegEx);
                if (extracted?.trim()) logger.debug(`[GROUPING_DEBUG] Group name extracted from opener title "${openerTab.title}" using regex "${rule.titleParsingRegEx}" (url fallback): "${extracted.trim()}".`);
            } catch (e) {
                logger.warn(`[GROUPING_DEBUG] Error parsing opener title "${openerTab.title}" with regex "${rule.titleParsingRegEx}".`, e.message);
            }
        }
        if (extracted?.trim()) {
            groupName = extracted.trim();
        } else {
            return null;
        }
    } else if (rule.groupNameSource === 'smart_manual') {
        // smart_manual: Si on ne trouve pas de nom de groupe, le demander à l'utilisateur
        const extracted = tryExtractGroupNameFromPresetOrFallback(rule, openerTab);
        if (extracted) {
            groupName = extracted;
        }
        // Note: la demande manuelle à l'utilisateur sera gérée dans handleManualGroupNaming
    } else if (rule.groupNameSource === 'smart_preset') {
        // smart_preset: Si pas d'ID trouvé, prendre le nom du preset comme nom de groupe
        const extracted = tryExtractGroupNameFromPresetOrFallback(rule, openerTab);
        if (extracted) {
            groupName = extracted;
        } else if (rule.presetId) {
            // Fallback: utiliser l'ID du preset
            groupName = rule.presetId;
            logger.debug(`[GROUPING_DEBUG] Using preset ID as fallback: "${groupName}".`);
        }
    } else if (rule.groupNameSource === 'smart_label') {
        // smart_label: Si pas d'id trouvé, prendre le nom du domainRule comme nom de groupe
        const extracted = tryExtractGroupNameFromPresetOrFallback(rule, openerTab);
        if (extracted) {
            groupName = extracted;
        } else {
            // Fallback: utiliser le label de la règle
            groupName = rule.label || "SmartGroup";
            logger.debug(`[GROUPING_DEBUG] Using rule label as fallback: "${groupName}".`);
        }
    } else if (rule.groupNameSource === 'smart') {
        // smart: Essayer d'extraire intelligemment avec les regex de la règle ; pas de fallback
        const extracted = tryExtractGroupNameFromPresetOrFallback(rule, openerTab);
        if (!extracted) {
            logger.debug(`[GROUPING_DEBUG] Smart mode: no name could be extracted for rule "${rule.label}". Skipping grouping.`);
            return null;
        }
        groupName = extracted;
    }
    
    const category = getRuleCategory(rule.categoryId);
    if (category) groupName = `${category.emoji} ${groupName}`;

    return groupName;
}

function tryExtractGroupNameFromPresetOrFallback(rule: DomainRuleSetting, openerTab: Browser.tabs.Tab): string | null {
    // Essayer d'extraire depuis le titre avec la regex de la règle (copiée depuis le preset)
    if (openerTab.title && rule.titleParsingRegEx) {
        try {
            const extracted = extractGroupNameFromTitle(openerTab.title, rule.titleParsingRegEx);
            if (extracted && extracted.trim()) {
                logger.debug(`[GROUPING_DEBUG] Group name extracted from opener title "${openerTab.title}" using regex "${rule.titleParsingRegEx}": "${extracted.trim()}".`);
                return extracted.trim();
            }
        } catch (e) {
            logger.warn(`[GROUPING_DEBUG] Error parsing opener title "${openerTab.title}" with regex "${rule.titleParsingRegEx}".`, e.message);
        }
    }

    // Essayer d'extraire depuis l'URL avec la regex de la règle (copiée depuis le preset)
    if (openerTab.url && rule.urlParsingRegEx) {
        try {
            const extracted = extractGroupNameFromUrl(openerTab.url, rule.urlParsingRegEx);
            if (extracted && extracted.trim()) {
                logger.debug(`[GROUPING_DEBUG] Group name extracted from opener URL "${openerTab.url}" using regex "${rule.urlParsingRegEx}": "${extracted.trim()}".`);
                return extracted.trim();
            }
        } catch (e) {
            logger.warn(`[GROUPING_DEBUG] Error parsing opener URL "${openerTab.url}" with regex "${rule.urlParsingRegEx}".`, e.message);
        }
    }

    logger.debug(`[GROUPING_DEBUG] No group name could be extracted for rule "${rule.label}".`);
    return null;
}

export function createGroupingContext(
    rule: DomainRuleSetting,
    openerTab: Browser.tabs.Tab,
    newTab: Browser.tabs.Tab,
    settings: any
): GroupingContext | null {
    const groupName = extractGroupNameFromRule(rule, openerTab);
    if (groupName === null) return null;
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
    logger.debug(`[GROUPING_DEBUG] Calling browser.tabs.group to create new group with tabs [${tabsToGroup.join(', ')}]`);
    const newGroupId = await browser.tabs.group({ tabIds: tabsToGroup as [number, ...number[]] });
    
    const updatePayload: any = { title: groupName, collapsed: false };
    if (groupColor) updatePayload.color = groupColor;
    
    logger.debug(`[GROUPING_DEBUG] New group created with ID: ${newGroupId}. Calling browser.tabGroups.update with payload:`, updatePayload);
    await browser.tabGroups.update(newGroupId, updatePayload);
    await incrementStat('tabGroupsCreatedCount');
    
    return newGroupId;
}

export async function addToExistingGroup(
    groupId: number, 
    tabId: number
): Promise<void> {
    logger.debug(`[GROUPING_DEBUG] Adding tab ${tabId} to existing group ${groupId}`);
    await browser.tabs.group({ groupId: groupId, tabIds: [tabId] });
    
    const updatePayload: any = { collapsed: false };
    logger.debug(`[GROUPING_DEBUG] Updating group ${groupId} with payload:`, updatePayload);
    await browser.tabGroups.update(groupId, updatePayload);
}

export async function handleManualGroupNaming(
    rule: DomainRuleSetting,
    targetGroupId: number,
    groupName: string,
    groupedTabIds: number[],
    openerTabId: number
): Promise<void> {
    if ((rule.groupNameSource !== 'manual' && rule.groupNameSource !== 'smart_manual') || !targetGroupId) {
        return;
    }
    
    const manualName = await promptForGroupName(groupName, openerTabId);
    if (manualName && manualName !== groupName) {
        await browser.tabGroups.update(targetGroupId, { title: manualName });
        logger.debug(`[GROUPING_DEBUG] Group ${targetGroupId} renamed manually to "${manualName}".`);
    } else if (manualName === null) {
        try {
            await browser.tabs.ungroup(groupedTabIds as [number, ...number[]]);
            logger.debug(`[GROUPING_DEBUG] Manual prompt cancelled. Ungrouped tabs ${groupedTabIds.join(', ')} from group ${targetGroupId}.`);
        } catch (ungroupErr) {
            logger.error('[GROUPING_DEBUG] Failed to ungroup after manual cancel', ungroupErr);
        }
    }
}

export async function performGroupingOperation(context: GroupingContext): Promise<{targetGroupId: number, groupedTabIds: number[]}> {
    const currentOpenerTab = await browser.tabs.get(context.openerTab.id);
    const openerGroupId = currentOpenerTab.groupId;
    
    logger.debug(`[GROUPING_DEBUG] Refreshed openerTab ${currentOpenerTab.id} ("${currentOpenerTab.url}"), current groupId: ${openerGroupId}. Using groupName "${context.groupName}".`);

    let targetGroupId: number;
    let groupedTabIds: number[];

    if (openerGroupId === browser.tabs.TAB_ID_NONE || typeof openerGroupId !== 'number' || openerGroupId <= 0) {
        logger.debug(`[GROUPING_DEBUG] Opener tab ${currentOpenerTab.id} is not in a group. Creating new group.`);
        const tabsToGroup = [currentOpenerTab.id, context.newTab.id];
        groupedTabIds = tabsToGroup.slice();
        targetGroupId = await createNewGroup(tabsToGroup, context.groupName, context.groupColor);
    } else {
        logger.debug(`[GROUPING_DEBUG] Opener tab ${currentOpenerTab.id} already in group ${openerGroupId}.`);
        targetGroupId = openerGroupId;
        groupedTabIds = [context.newTab.id];
        await addToExistingGroup(openerGroupId, context.newTab.id);
    }

    return { targetGroupId, groupedTabIds };
}

export async function processGroupingForNewTab(openerTab: Browser.tabs.Tab, newTab: Browser.tabs.Tab): Promise<void> {
    logger.debug(`[GROUPING_DEBUG] Processing grouping for openerTab ${openerTab.id} and newTab ${newTab.id}.`);
    
    const settings = await getSettings();
    if (!settings.globalGroupingEnabled || !openerTab?.url) {
        logger.debug(`[GROUPING_DEBUG] Grouping disabled or opener URL missing.`);
        return;
    }

    // Skip grouping if the opener tab is in a non-normal window (Chrome installed app / PWA)
    if (openerTab.windowId != null) {
        const openerWindow = await browser.windows.get(openerTab.windowId).catch(() => null);
        if (openerWindow && openerWindow.type !== 'normal') {
            logger.debug(`[GROUPING_DEBUG] Skipping grouping: opener tab is in a non-normal window (type: ${openerWindow.type}).`);
            return;
        }
    }

    const rule = findMatchingRule(openerTab.url, settings.domainRules);
    if (!rule) {
        logger.debug(`[GROUPING_DEBUG] No matching rule for opener tab URL: ${openerTab.url}`);
        return;
    }

    if (!rule.groupingEnabled) {
        logger.debug(`[GROUPING_DEBUG] Rule "${rule.label}" has groupingEnabled=false. No grouping.`);
        return;
    }

    const context = createGroupingContext(rule, openerTab, newTab, settings);
    if (context === null) {
        logger.debug(`[GROUPING_DEBUG] Skipping grouping: no name could be extracted for rule "${rule.label}".`);
        return;
    }
    logger.debug(`[GROUPING_DEBUG] Rule found: "${rule.label}", groupName: "${context.groupName}"`);

    try {
        const { targetGroupId, groupedTabIds } = await performGroupingOperation(context);
        logger.debug(`[GROUPING_DEBUG] Grouping completed for new tab ${newTab.id}. Color: ${context.groupColor || 'Chrome default'}.`);

        // For smart_manual: only prompt when extraction failed (user story: "extracts name OR falls back to manual prompt").
        // For plain manual: always prompt.
        const needsManualNaming =
            rule.groupNameSource === 'manual' ||
            (rule.groupNameSource === 'smart_manual' && !tryExtractGroupNameFromPresetOrFallback(rule, openerTab));
        if (needsManualNaming) {
            await handleManualGroupNaming(rule, targetGroupId, context.groupName, groupedTabIds, openerTab.id);
        }

        // Show notification if enabled with undo action
        if (settings.notifyOnGrouping) {
            const undoAction: UndoAction = {
                type: 'ungroup',
                data: { tabIds: groupedTabIds }
            };
            showNotification({
                title: getMessage('notificationGroupingTitle'),
                message: getMessage('notificationGroupingMessage').replace('{groupName}', context.groupName),
                type: 'success',
                undoAction
            });
        }
    } catch (error) {
        logger.error(`[GROUPING_DEBUG] Error during grouping for new tab ${newTab.id}:`, error);
        if (error.message && (
            error.message.toLowerCase().includes("no tab with id") ||
            error.message.toLowerCase().includes("no tab group with id") ||
            error.message.toLowerCase().includes("cannot group tab in a closed window") ||
            error.message.toLowerCase().includes("invalid tab id")
        )) {
            logger.warn(`[GROUPING_DEBUG] The error suggests a tab/group/window was closed or ID was invalid during operation.`);
        }
    }
}