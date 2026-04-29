import { browser, Browser } from 'wxt/browser';
import { getSettings } from './settings.js';
import {
    findMatchingRule,
    findGroupingRuleForTab,
    determineGroupColor,
    createNewGroup,
    addToExistingGroup,
} from './grouping.js';
import { getMatchMode, isUrlMatch } from './deduplication.js';
import { getStatisticsData, updateStatisticsData } from '@/utils/statisticsUtils.js';
import { getMessage } from '@/utils/i18n.js';
import { logger } from '@/utils/logger.js';
import type { DomainRuleSetting, AppSettings } from '@/types/syncSettings.js';
import type { ChromeTabGroupsExtended, ChromeNotificationsAPI } from '@/types/chromeApi.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlanEntry {
    tab: Browser.tabs.Tab;
    targetGroupName: string;
    groupColor: string | null;
    rule: DomainRuleSetting;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isOrganizableUrl(url: string | undefined): url is string {
    return (
        !!url &&
        !url.startsWith('chrome:') &&
        !url.startsWith('chrome-extension:') &&
        !url.startsWith('about:')
    );
}

// ---------------------------------------------------------------------------
// Step 1 — Batch deduplication
// ---------------------------------------------------------------------------

/**
 * Deduplicates all tabs in the window according to their matching domain rule.
 * Independent of the global deduplication toggle (manual action per US-PO006).
 * Honors `deduplicateUnmatchedDomains` to decide whether tabs without a
 * matching rule are included (bucketed together under exact-match mode).
 * Returns the number of duplicate tabs removed.
 */
interface DedupBucket {
    rule: DomainRuleSetting | undefined;
    tabs: Browser.tabs.Tab[];
}

const UNMATCHED_DEDUP_KEY = '__unmatched__:exact';

function resolveDedupBucketKey(
    tab: Browser.tabs.Tab,
    settings: AppSettings,
): { key: string; rule: DomainRuleSetting | undefined } | null {
    const rule = findMatchingRule(tab.url!, settings.domainRules);
    if (rule) {
        if (!rule.enabled || !rule.deduplicationEnabled) return null;
        return { key: `${rule.id}:${getMatchMode(rule)}`, rule };
    }
    if (settings.deduplicateUnmatchedDomains) {
        return { key: UNMATCHED_DEDUP_KEY, rule: undefined };
    }
    return null;
}

function buildDeduplicationBuckets(
    organizable: Browser.tabs.Tab[],
    settings: AppSettings,
): Map<string, DedupBucket> {
    const buckets = new Map<string, DedupBucket>();
    for (const tab of organizable) {
        const resolved = resolveDedupBucketKey(tab, settings);
        if (!resolved) continue;
        let bucket = buckets.get(resolved.key);
        if (!bucket) {
            bucket = { rule: resolved.rule, tabs: [] };
            buckets.set(resolved.key, bucket);
        }
        bucket.tabs.push(tab);
    }
    return buckets;
}

function markExactDuplicates(tabs: Browser.tabs.Tab[], toRemove: Set<number>, toReload: Set<number>): void {
    const seen = new Map<string, number>();
    for (const tab of tabs) {
        if (toRemove.has(tab.id!)) continue;
        if (seen.has(tab.url!)) {
            toRemove.add(tab.id!);
        } else {
            seen.set(tab.url!, tab.id!);
            toReload.add(tab.id!);
        }
    }
}

function markIncludesDuplicates(tabs: Browser.tabs.Tab[], toRemove: Set<number>, toReload: Set<number>): void {
    const kept: Browser.tabs.Tab[] = [];
    for (const tab of tabs) {
        if (toRemove.has(tab.id!)) continue;
        const isDup = kept.some(k => isUrlMatch(k.url!, tab.url!, 'includes'));
        if (isDup) {
            toRemove.add(tab.id!);
        } else {
            kept.push(tab);
            toReload.add(tab.id!);
        }
    }
}

async function commitDeduplication(toRemove: Set<number>, toReload: Set<number>): Promise<number> {
    for (const id of toRemove) toReload.delete(id);

    for (const id of toReload) {
        await browser.tabs.reload(id).catch(() => {});
    }

    const removeIds = [...toRemove];
    if (removeIds.length === 0) return 0;

    await browser.tabs.remove(removeIds as [number, ...number[]]).catch(e => {
        logger.warn('[ORGANIZE] Error removing duplicate tabs:', e);
    });

    const stats = await getStatisticsData();
    await updateStatisticsData({
        tabsDeduplicatedCount: stats.tabsDeduplicatedCount + removeIds.length,
    });
    return removeIds.length;
}

async function batchDeduplicateTabs(windowId: number, settings: AppSettings): Promise<number> {
    const allTabs = await browser.tabs.query({ windowId });
    const organizable = allTabs
        .filter(t => isOrganizableUrl(t.url))
        .sort((a, b) => a.index - b.index);

    const buckets = buildDeduplicationBuckets(organizable, settings);

    const toRemove = new Set<number>();
    const toReload = new Set<number>();

    for (const { rule, tabs } of buckets.values()) {
        if (getMatchMode(rule) === 'exact') {
            markExactDuplicates(tabs, toRemove, toReload);
        } else {
            markIncludesDuplicates(tabs, toRemove, toReload);
        }
    }

    const removedCount = await commitDeduplication(toRemove, toReload);
    logger.debug(`[ORGANIZE] Dedup complete: ${removedCount} tab(s) removed.`);
    return removedCount;
}

// ---------------------------------------------------------------------------
// Step 2 — Build grouping plan
// ---------------------------------------------------------------------------

/**
 * Calculates target groups for all eligible tabs without modifying anything.
 * Returns only entries whose target group has ≥ 2 members.
 * Per US-PO008: single-member target groups are excluded.
 */
async function buildOrganizePlan(windowId: number, settings: AppSettings): Promise<PlanEntry[]> {
    // Re-query after dedup so removed tabs are no longer present
    const allTabs = await browser.tabs.query({ windowId });
    const organizable = allTabs.filter(t => isOrganizableUrl(t.url));

    const allEntries: PlanEntry[] = [];

    for (const tab of organizable) {
        // Pass the tab itself as "openerTab": safe for label/url/title/smart sources.
        // coerceManualToLabel maps manual / smart_manual sources to smart_label so
        // bulk organize falls back to the rule label without prompting the user.
        const grouping = findGroupingRuleForTab(
            tab as Browser.tabs.Tab,
            settings.domainRules,
            { coerceManualToLabel: true },
        );
        if (!grouping) continue;

        const { rule, groupName } = grouping;
        const groupColor = determineGroupColor(rule);
        allEntries.push({ tab, targetGroupName: groupName, groupColor, rule });
    }

    // Count members per target group name
    const countByName = new Map<string, number>();
    for (const entry of allEntries) {
        countByName.set(entry.targetGroupName, (countByName.get(entry.targetGroupName) ?? 0) + 1);
    }

    // Exclude single-member groups (US-PO008): a tab already in a group stays there untouched.
    return allEntries.filter(entry => (countByName.get(entry.targetGroupName) ?? 0) >= 2);
}

// ---------------------------------------------------------------------------
// Step 3 — Apply grouping plan
// ---------------------------------------------------------------------------

type ExistingGroup = { id: number; title?: string };

function groupPlanByName(plan: PlanEntry[]): Map<string, PlanEntry[]> {
    const byName = new Map<string, PlanEntry[]>();
    for (const entry of plan) {
        let bucket = byName.get(entry.targetGroupName);
        if (!bucket) {
            bucket = [];
            byName.set(entry.targetGroupName, bucket);
        }
        bucket.push(entry);
    }
    return byName;
}

function selectTabsToMove(
    entries: PlanEntry[],
    targetName: string,
    existingGroups: ExistingGroup[],
): PlanEntry[] {
    return entries.filter(e => {
        const gid = e.tab.groupId;
        if (gid == null || gid <= 0) return true;
        const currentTitle = existingGroups.find(g => g.id === gid)?.title ?? '';
        return currentTitle !== targetName;
    });
}

async function moveEntriesIntoTargetGroup(
    targetName: string,
    entries: PlanEntry[],
    tabsToMove: PlanEntry[],
    existingGroupId: number | undefined,
): Promise<{ created: boolean }> {
    if (existingGroupId != null) {
        for (const entry of tabsToMove) {
            await addToExistingGroup(existingGroupId, entry.tab.id!);
        }
        return { created: false };
    }
    const tabIds = tabsToMove.map(e => e.tab.id!);
    await createNewGroup(tabIds, targetName, entries[0].groupColor, entries[0].rule.id);
    return { created: true };
}

async function applyOrganizePlan(
    plan: PlanEntry[],
    windowId: number,
): Promise<{ tabsGrouped: number; groupCount: number }> {
    if (plan.length === 0) return { tabsGrouped: 0, groupCount: 0 };

    const existingGroups = await (browser.tabGroups as unknown as ChromeTabGroupsExtended).query({ windowId });
    const existingByTitle = new Map<string, number>();
    for (const g of existingGroups) {
        if (g.title) existingByTitle.set(g.title, g.id);
    }

    const byName = groupPlanByName(plan);

    let tabsGrouped = 0;
    let groupCount = 0;

    for (const [targetName, entries] of byName) {
        const existingGroupId = existingByTitle.get(targetName);
        const tabsToMove = selectTabsToMove(entries, targetName, existingGroups);

        if (tabsToMove.length === 0) {
            // All tabs already in the correct group — count them but skip API calls
            tabsGrouped += entries.length;
            groupCount += 1;
            continue;
        }

        try {
            const { created } = await moveEntriesIntoTargetGroup(targetName, entries, tabsToMove, existingGroupId);
            if (created) groupCount += 1;
            tabsGrouped += entries.length;
        } catch (e) {
            logger.error(`[ORGANIZE] Error grouping tabs for "${targetName}":`, e);
        }
    }

    logger.debug(`[ORGANIZE] Grouping complete: ${tabsGrouped} tab(s) grouped into ${groupCount} group(s).`);
    return { tabsGrouped, groupCount: byName.size };
}

// ---------------------------------------------------------------------------
// Step 4 — Reposition & collapse
// ---------------------------------------------------------------------------

/**
 * Moves all tab groups to the front of the window (before ungrouped tabs),
 * preserving their relative order, then collapses them all.
 */
async function repositionAndCollapseGroups(windowId: number): Promise<void> {
    const allGroups = await (browser.tabGroups as unknown as ChromeTabGroupsExtended).query({ windowId });
    if (allGroups.length === 0) return;

    // Find first-tab index for each group to establish current L→R order
    const grouped = await Promise.all(
        allGroups.map(async (g: { id: number }) => {
            const tabs = await browser.tabs.query({ groupId: g.id, windowId });
            const minIndex = tabs.length > 0 ? Math.min(...tabs.map(t => t.index)) : Infinity;
            return { g, minIndex };
        }),
    );
    grouped.sort((a, b) => a.minIndex - b.minIndex);

    // Move in REVERSE order to index 0 — preserves original relative order
    // Example: groups [A@2, B@7, C@15] sorted → reversed [C, B, A]
    // Move C to 0 → [C,...], Move B to 0 → [B, C,...], Move A to 0 → [A, B, C,...]
    for (const { g } of [...grouped].reverse()) {
        await (browser.tabGroups as unknown as ChromeTabGroupsExtended).move(g.id, { index: 0 }).catch(() => {});
    }

    // Collapse all groups
    for (const { g } of grouped) {
        await browser.tabGroups.update(g.id, { collapsed: true }).catch(() => {});
    }

    logger.debug(`[ORGANIZE] Repositioned and collapsed ${allGroups.length} group(s).`);
}

// ---------------------------------------------------------------------------
// Main exported handler
// ---------------------------------------------------------------------------

/**
 * Orchestrates the full "Organize All Tabs" action:
 * 1. Batch deduplication
 * 2. Build grouping plan
 * 3. Apply plan
 * 4. Reposition & collapse groups
 * 5. Show notifications
 */
export async function handleOrganizeAllTabs(windowId: number): Promise<void> {
    logger.debug(`[ORGANIZE] Starting organize for window ${windowId}.`);

    const settings = await getSettings();

    // ── 1. Deduplication ────────────────────────────────────────────────────
    const removedCount = await batchDeduplicateTabs(windowId, settings);

    if (removedCount > 0 && settings.notifyOnDeduplication) {
        (browser as unknown as { notifications: ChromeNotificationsAPI }).notifications.create({
            type: 'basic',
            iconUrl: browser.runtime.getURL('/icons/icon128.png'),
            title: getMessage('extensionName'),
            message: getMessage('notifDeduplication', [String(removedCount)]),
        });
    }

    // ── 2. Plan grouping ────────────────────────────────────────────────────
    const plan = await buildOrganizePlan(windowId, settings);

    // ── 3. Apply plan ───────────────────────────────────────────────────────
    const { tabsGrouped, groupCount } = await applyOrganizePlan(plan, windowId);

    // ── 4. Reposition & collapse ────────────────────────────────────────────
    await repositionAndCollapseGroups(windowId);

    // ── 5. Grouping notification ────────────────────────────────────────────
    if (tabsGrouped > 0 && settings.notifyOnGrouping) {
        (browser as unknown as { notifications: ChromeNotificationsAPI }).notifications.create({
            type: 'basic',
            iconUrl: browser.runtime.getURL('/icons/icon128.png'),
            title: getMessage('extensionName'),
            message: getMessage('notifGrouping', [String(tabsGrouped), String(groupCount)]),
        });
    }

    logger.debug(
        `[ORGANIZE] Done. Removed: ${removedCount} dup(s). Grouped: ${tabsGrouped} tab(s) in ${groupCount} group(s).`,
    );
}
