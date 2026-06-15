import { browser, Browser } from 'wxt/browser';
import { incrementStat, stampRuleLastUsed } from '@/utils/statisticsUtils.js';
import { markDiscovered, markValue } from '@/exploration/progressStore.js';
import { matchesDomain, extractGroupNameFromTitle, extractGroupNameFromUrlByMode } from '@/utils/utils';
import { getSettings } from './settings.js';
import { promptForGroupName } from './messaging.js';
import { showNotification, type UndoAction } from '@/utils/notifications.js';
import { getMessage } from '@/utils/i18n.js';
import type { DomainRuleSetting, AppSettings } from '@/types/syncSettings.js';
import type { ChromeTabGroupsExtended } from '@/types/chromeApi.js';
import { getRuleCategory } from '@/utils/categoriesStore.js';
import { logger } from '@/utils/logger.js';

export interface GroupingContext {
    rule: DomainRuleSetting;
    groupName: string;
    groupColor: string | null;
    openerTab: Browser.tabs.Tab;
    newTab: Browser.tabs.Tab;
}

function describeUrlExtraction(rule: DomainRuleSetting): string {
    return rule.urlExtractionMode === 'query_param'
        ? `query param "${rule.urlQueryParamName ?? ''}"`
        : `regex "${rule.urlParsingRegEx ?? ''}"`;
}

function hasUrlExtractor(rule: DomainRuleSetting): boolean {
    return rule.urlExtractionMode === 'query_param'
        ? !!rule.urlQueryParamName
        : !!rule.urlParsingRegEx;
}

function describeError(e: unknown): unknown {
    return e instanceof Error ? e.message : e;
}

const TRANSIENT_TAB_ERROR_FRAGMENTS = [
    "no tab with id",
    "no tab group with id",
    "cannot group tab in a closed window",
    "invalid tab id",
] as const;

function isTransientTabError(error: unknown): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    return !!message && TRANSIENT_TAB_ERROR_FRAGMENTS.some(fragment => message.includes(fragment));
}

export function findMatchingRule(url: string, domainRules: DomainRuleSetting[]): DomainRuleSetting | undefined {
    return domainRules.find(r => r.enabled && matchesDomain(url, r.domainFilter));
}

export function findMatchingRules(url: string, domainRules: DomainRuleSetting[]): DomainRuleSetting[] {
    return domainRules.filter(r => r.enabled && matchesDomain(url, r.domainFilter));
}

// Returns the first enabled rule matching the URL's domain whose
// groupingEnabled is true AND that produces a non-null group name.
// Skips rules whose groupingEnabled=false or whose extraction returns null,
// so that a later rule on the same domain can apply.
export function findGroupingRuleForTab(
    openerTab: Browser.tabs.Tab,
    domainRules: DomainRuleSetting[],
    options: { coerceManualToLabel?: boolean } = {}
): { rule: DomainRuleSetting; groupName: string } | null {
    if (!openerTab.url) return null;

    for (const rule of findMatchingRules(openerTab.url, domainRules)) {
        if (!rule.groupingEnabled) {
            logger.debug(`[GROUPING_DEBUG] Rule "${rule.label}" has groupingEnabled=false. Trying next matching rule.`);
            continue;
        }

        const effectiveRule: DomainRuleSetting =
            options.coerceManualToLabel &&
            (rule.groupNameSource === 'manual' || rule.groupNameSource === 'smart_manual')
                ? { ...rule, groupNameSource: 'smart_label' as const }
                : rule;

        const groupName = extractGroupNameFromRule(effectiveRule, openerTab);
        if (groupName !== null) {
            return { rule, groupName };
        }
        logger.debug(`[GROUPING_DEBUG] Rule "${rule.label}" matched the domain but produced no group name. Trying next.`);
    }

    return null;
}

export function determineGroupColor(rule: DomainRuleSetting, _settings?: AppSettings): string | null {
    if (rule.color) {
        logger.debug(`[GROUPING_DEBUG] Using rule color: "${rule.color}".`);
        return rule.color;
    }
    logger.debug(`[GROUPING_DEBUG] Rule has no color defined.`);
    return null;
}

function tryExtractFromTitle(rule: DomainRuleSetting, openerTab: Browser.tabs.Tab, fallbackContext = ''): string | null {
    if (!openerTab.title || !rule.titleParsingRegEx) return null;
    try {
        const extracted = extractGroupNameFromTitle(openerTab.title, rule.titleParsingRegEx);
        if (extracted?.trim()) {
            const suffix = fallbackContext ? ` ${fallbackContext}` : '';
            logger.debug(`[GROUPING_DEBUG] Group name extracted from opener title "${openerTab.title}" using regex "${rule.titleParsingRegEx}"${suffix}: "${extracted.trim()}".`);
            return extracted.trim();
        }
    } catch (e) {
        logger.warn(`[GROUPING_DEBUG] Error parsing opener title "${openerTab.title}" with regex "${rule.titleParsingRegEx}".`, describeError(e));
    }
    return null;
}

function tryExtractFromUrl(rule: DomainRuleSetting, openerTab: Browser.tabs.Tab, fallbackContext = ''): string | null {
    if (!openerTab.url || !hasUrlExtractor(rule)) return null;
    try {
        const extracted = extractGroupNameFromUrlByMode(openerTab.url, rule);
        if (extracted?.trim()) {
            const suffix = fallbackContext ? ` ${fallbackContext}` : '';
            logger.debug(`[GROUPING_DEBUG] Group name extracted from opener URL "${openerTab.url}" using ${describeUrlExtraction(rule)}${suffix}: "${extracted.trim()}".`);
            return extracted.trim();
        }
    } catch (e) {
        logger.warn(`[GROUPING_DEBUG] Error parsing opener URL "${openerTab.url}" with ${describeUrlExtraction(rule)}.`, describeError(e));
    }
    return null;
}

function extractRawGroupName(rule: DomainRuleSetting, openerTab: Browser.tabs.Tab): string | null {
    const fallbackLabel = rule.fallbackLabel?.trim() || rule.label || 'SmartGroup';

    switch (rule.groupNameSource) {
        case 'title':
            return tryExtractFromTitle(rule, openerTab) ?? tryExtractFromUrl(rule, openerTab, '(title fallback)');
        case 'url':
            return tryExtractFromUrl(rule, openerTab) ?? tryExtractFromTitle(rule, openerTab, '(url fallback)');
        case 'smart_manual':
            // When extraction fails, the user is prompted via handleManualGroupNaming.
            return tryExtractGroupNameFromPresetOrFallback(rule, openerTab) ?? fallbackLabel;
        case 'smart_preset': {
            const extracted = tryExtractGroupNameFromPresetOrFallback(rule, openerTab);
            if (extracted) return extracted;
            if (rule.presetId) {
                logger.debug(`[GROUPING_DEBUG] Using preset ID as fallback: "${rule.presetId}".`);
                return rule.presetId;
            }
            return fallbackLabel;
        }
        case 'smart_label': {
            const extracted = tryExtractGroupNameFromPresetOrFallback(rule, openerTab);
            if (extracted) return extracted;
            logger.debug(`[GROUPING_DEBUG] Using rule fallback label: "${fallbackLabel}".`);
            return fallbackLabel;
        }
        case 'smart': {
            const extracted = tryExtractGroupNameFromPresetOrFallback(rule, openerTab);
            if (!extracted) {
                logger.debug(`[GROUPING_DEBUG] Smart mode: no name could be extracted for rule "${rule.label}". Skipping grouping.`);
                return null;
            }
            return extracted;
        }
        case 'label':
            logger.debug(`[GROUPING_DEBUG] Label mode: using rule fallback label: "${fallbackLabel}".`);
            return fallbackLabel;
        default:
            return fallbackLabel;
    }
}

export function extractGroupNameFromRule(rule: DomainRuleSetting, openerTab: Browser.tabs.Tab): string | null {
    const rawName = extractRawGroupName(rule, openerTab);
    if (rawName === null) return null;
    const category = getRuleCategory(rule.categoryId);
    return category ? `${category.emoji} ${rawName}` : rawName;
}

function tryExtractGroupNameFromPresetOrFallback(rule: DomainRuleSetting, openerTab: Browser.tabs.Tab): string | null {
    const fromTitle = tryExtractFromTitle(rule, openerTab);
    if (fromTitle) return fromTitle;

    const fromUrl = tryExtractFromUrl(rule, openerTab);
    if (fromUrl) return fromUrl;

    logger.debug(`[GROUPING_DEBUG] No group name could be extracted for rule "${rule.label}".`);
    return null;
}

export function createGroupingContext(
    rule: DomainRuleSetting,
    openerTab: Browser.tabs.Tab,
    newTab: Browser.tabs.Tab,
    settings: AppSettings
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
    groupColor: string | null,
    ruleId: string
): Promise<number> {
    logger.debug(`[GROUPING_DEBUG] Calling browser.tabs.group to create new group with tabs [${tabsToGroup.join(', ')}]`);
    const newGroupId = await browser.tabs.group({ tabIds: tabsToGroup as [number, ...number[]] });

    const updatePayload: { title: string; collapsed: boolean; color?: string } = { title: groupName, collapsed: false };
    if (groupColor) updatePayload.color = groupColor;

    logger.debug(`[GROUPING_DEBUG] New group created with ID: ${newGroupId}. Calling browser.tabGroups.update with payload:`, updatePayload);
    await browser.tabGroups.update(newGroupId, updatePayload as Parameters<typeof browser.tabGroups.update>[1]);
    await incrementStat('grouping', ruleId);
    await stampRuleLastUsed(ruleId);
    // Exploration: creating a group means the "create a rule" capability is in
    // use. Also record the distinct color seen (multi-valued capability).
    void markDiscovered('grouping.create');
    if (groupColor) void markValue('grouping.color', groupColor);

    return newGroupId;
}

export async function addToExistingGroup(
    groupId: number,
    tabId: number
): Promise<void> {
    logger.debug(`[GROUPING_DEBUG] Adding tab ${tabId} to existing group ${groupId}`);
    await browser.tabs.group({ groupId: groupId, tabIds: [tabId] });
    // Exploration: a tab joined an existing group (merge into a live group).
    void markDiscovered('grouping.merge');

    const updatePayload: { collapsed: boolean } = { collapsed: false };
    logger.debug(`[GROUPING_DEBUG] Updating group ${groupId} with payload:`, updatePayload);
    await browser.tabGroups.update(groupId, updatePayload);
}

// Looks up a tab group in `windowId` whose title matches `groupName`.
// When the rule provides a `groupColor`, the group's color must match too;
// when `groupColor` is null the rule has no color preference, so any color
// is accepted.
export async function findMatchingExistingGroup(
    windowId: number | undefined,
    groupName: string,
    groupColor: string | null
): Promise<number | null> {
    if (windowId === undefined) return null;
    try {
        const groups = await (browser.tabGroups as unknown as ChromeTabGroupsExtended).query({ windowId });
        const match = groups.find(g =>
            g.title === groupName &&
            (groupColor === null || g.color === groupColor)
        );
        return match?.id ?? null;
    } catch (e) {
        logger.warn('[GROUPING_DEBUG] findMatchingExistingGroup: tabGroups.query failed.', describeError(e));
        return null;
    }
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

export async function performGroupingOperation(context: GroupingContext): Promise<{targetGroupId: number, groupedTabIds: number[], joinedExisting: boolean}> {
    const openerTabId = context.openerTab.id;
    const newTabId = context.newTab.id;
    if (openerTabId === undefined || newTabId === undefined) {
        throw new Error('performGroupingOperation: openerTab.id or newTab.id is undefined');
    }

    const currentOpenerTab = await browser.tabs.get(openerTabId);
    const currentOpenerTabId = currentOpenerTab.id ?? openerTabId;
    const openerGroupId = currentOpenerTab.groupId;

    logger.debug(`[GROUPING_DEBUG] Refreshed openerTab ${currentOpenerTabId} ("${currentOpenerTab.url}"), current groupId: ${openerGroupId}. Using groupName "${context.groupName}".`);

    let targetGroupId: number;
    let groupedTabIds: number[];
    let joinedExisting = false;

    if (openerGroupId === browser.tabs.TAB_ID_NONE || typeof openerGroupId !== 'number' || openerGroupId <= 0) {
        const matchingGroupId = await findMatchingExistingGroup(
            currentOpenerTab.windowId,
            context.groupName,
            context.groupColor
        );

        if (matchingGroupId !== null) {
            logger.debug(`[GROUPING_DEBUG] Opener tab ${currentOpenerTabId} is not grouped; joining existing group ${matchingGroupId} matching name "${context.groupName}" and color "${context.groupColor ?? '(any)'}".`);
            targetGroupId = matchingGroupId;
            groupedTabIds = [currentOpenerTabId, newTabId];
            await browser.tabs.group({ groupId: matchingGroupId, tabIds: [currentOpenerTabId, newTabId] });
            await browser.tabGroups.update(matchingGroupId, { collapsed: false });
            joinedExisting = true;
        } else {
            logger.debug(`[GROUPING_DEBUG] Opener tab ${currentOpenerTabId} is not in a group and no matching existing group found. Creating new group.`);
            const tabsToGroup = [currentOpenerTabId, newTabId];
            groupedTabIds = tabsToGroup.slice();
            targetGroupId = await createNewGroup(tabsToGroup, context.groupName, context.groupColor, context.rule.id);
        }
    } else {
        logger.debug(`[GROUPING_DEBUG] Opener tab ${currentOpenerTabId} already in group ${openerGroupId}.`);
        targetGroupId = openerGroupId;
        groupedTabIds = [newTabId];
        await addToExistingGroup(openerGroupId, newTabId);
    }

    return { targetGroupId, groupedTabIds, joinedExisting };
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

    const grouping = findGroupingRuleForTab(openerTab, settings.domainRules);
    if (!grouping) {
        logger.debug(`[GROUPING_DEBUG] No applicable grouping rule for opener tab URL: ${openerTab.url}`);
        return;
    }

    const { rule, groupName } = grouping;
    const groupColor = determineGroupColor(rule, settings);
    const context: GroupingContext = { rule, groupName, groupColor, openerTab, newTab };
    logger.debug(`[GROUPING_DEBUG] Rule found: "${rule.label}", groupName: "${context.groupName}"`);

    try {
        const { targetGroupId, groupedTabIds, joinedExisting } = await performGroupingOperation(context);
        logger.debug(`[GROUPING_DEBUG] Grouping completed for new tab ${newTab.id}. Color: ${context.groupColor || 'Chrome default'}.`);

        // For smart_manual: only prompt when extraction failed (user story: "extracts name OR falls back to manual prompt").
        // For plain manual: always prompt.
        // Skip manual naming when we joined an existing group: its name is already settled.
        const needsManualNaming =
            !joinedExisting &&
            (rule.groupNameSource === 'manual' ||
                (rule.groupNameSource === 'smart_manual' && !tryExtractGroupNameFromPresetOrFallback(rule, openerTab)));
        if (needsManualNaming && openerTab.id !== undefined) {
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
        if (isTransientTabError(error)) {
            logger.warn(`[GROUPING_DEBUG] The error suggests a tab/group/window was closed or ID was invalid during operation.`);
        }
    }
}
