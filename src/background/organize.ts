import { browser, Browser } from 'wxt/browser';
import { getSettings } from './settings.js';
import {
    findMatchingRule,
    extractGroupNameFromRule,
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
async function batchDeduplicateTabs(windowId: number, settings: AppSettings): Promise<number> {
    const allTabs = await browser.tabs.query({ windowId });
    const organizable = allTabs
        .filter(t => isOrganizableUrl(t.url))
        .sort((a, b) => a.index - b.index);

    // Group tabs by rule + matchMode bucket (unmatched tabs share a single
    // `__unmatched__:exact` bucket when settings.deduplicateUnmatchedDomains
    // is true).
    const UNMATCHED_KEY = '__unmatched__:exact';
    const buckets = new Map<string, { rule: DomainRuleSetting | undefined; tabs: Browser.tabs.Tab[] }>();

    for (const tab of organizable) {
        const rule = findMatchingRule(tab.url!, settings.domainRules);
        let bucketKey: string;
        let bucketRule: DomainRuleSetting | undefined;

        if (rule) {
            if (!rule.enabled || !rule.deduplicationEnabled) continue;
            bucketKey = `${rule.id}:${getMatchMode(rule)}`;
            bucketRule = rule;
        } else if (settings.deduplicateUnmatchedDomains) {
            bucketKey = UNMATCHED_KEY;
            bucketRule = undefined;
        } else {
            continue;
        }

        if (!buckets.has(bucketKey)) buckets.set(bucketKey, { rule: bucketRule, tabs: [] });
        buckets.get(bucketKey)!.tabs.push(tab);
    }

    const toRemove = new Set<number>();
    const toReload = new Set<number>();

    for (const { rule, tabs } of buckets.values()) {
        const mode = getMatchMode(rule);

        if (mode === 'exact') {
            const seen = new Map<string, number>(); // url → tabId
            for (const tab of tabs) {
                if (toRemove.has(tab.id!)) continue; // already marked
                if (seen.has(tab.url!)) {
                    toRemove.add(tab.id!);
                } else {
                    seen.set(tab.url!, tab.id!);
                    toReload.add(tab.id!);
                }
            }
        } else {
            // includes mode
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
    }

    // A tab can't be in both sets (e.g. matched by two different rule buckets)
    for (const id of toRemove) toReload.delete(id);

    // Reload keepers first (best-effort)
    for (const id of toReload) {
        await browser.tabs.reload(id).catch(() => {});
    }

    // Single batch remove
    const removeIds = [...toRemove];
    if (removeIds.length > 0) {
        await browser.tabs.remove(removeIds as [number, ...number[]]).catch(e => {
            logger.warn('[ORGANIZE] Error removing duplicate tabs:', e);
        });

        const stats = await getStatisticsData();
        await updateStatisticsData({
            tabsDeduplicatedCount: stats.tabsDeduplicatedCount + removeIds.length,
        });
    }

    logger.debug(`[ORGANIZE] Dedup complete: ${removeIds.length} tab(s) removed.`);
    return removeIds.length;
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
        const rule = findMatchingRule(tab.url!, settings.domainRules);
        if (!rule || !rule.enabled || !rule.groupingEnabled) continue;

        // Skip sources that require user interaction — fall back to rule.label via smart_label
        const effectiveRule: DomainRuleSetting =
            rule.groupNameSource === 'manual' || rule.groupNameSource === 'smart_manual'
                ? { ...rule, groupNameSource: 'smart_label' as const }
                : rule;

        // Pass the tab itself as "openerTab" — safe for label/url/title/smart sources
        const targetGroupName = extractGroupNameFromRule(effectiveRule, tab as Browser.tabs.Tab);
        const groupColor = determineGroupColor(rule);

        allEntries.push({ tab, targetGroupName, groupColor, rule });
    }

    // Count members per target group name
    const countByName = new Map<string, number>();
    for (const entry of allEntries) {
        countByName.set(entry.targetGroupName, (countByName.get(entry.targetGroupName) ?? 0) + 1);
    }

    // Exclude single-member groups (US-PO008)
    return allEntries.filter(entry => {
        const count = countByName.get(entry.targetGroupName) ?? 0;
        if (count >= 2) return true;
        // count < 2: exclude regardless of whether the tab is already in a group
        // (tab already in a group stays there untouched)
        return false;
    });
}

// ---------------------------------------------------------------------------
// Step 3 — Apply grouping plan
// ---------------------------------------------------------------------------

async function applyOrganizePlan(
    plan: PlanEntry[],
    windowId: number,
): Promise<{ tabsGrouped: number; groupCount: number }> {
    if (plan.length === 0) return { tabsGrouped: 0, groupCount: 0 };

    // Fetch current groups to detect existing ones by title
    const existingGroups = await (browser.tabGroups as unknown as ChromeTabGroupsExtended).query({ windowId });
    const existingByTitle = new Map<string, number>(); // title → groupId
    for (const g of existingGroups) {
        if (g.title) existingByTitle.set(g.title, g.id);
    }

    // Group plan entries by targetGroupName
    const byName = new Map<string, PlanEntry[]>();
    for (const entry of plan) {
        if (!byName.has(entry.targetGroupName)) byName.set(entry.targetGroupName, []);
        byName.get(entry.targetGroupName)!.push(entry);
    }

    let tabsGrouped = 0;
    let groupCount = 0;

    for (const [targetName, entries] of byName) {
        const existingGroupId = existingByTitle.get(targetName);
        const groupColor = entries[0].groupColor;

        // Determine which tabs actually need to move:
        // - not in any group, OR
        // - in a group whose title ≠ targetName
        const tabsToMove = entries.filter(e => {
            const gid = e.tab.groupId;
            if (gid == null || gid <= 0) return true; // not grouped
            const currentTitle = existingGroups.find(g => g.id === gid)?.title ?? '';
            return currentTitle !== targetName;
        });

        if (tabsToMove.length === 0) {
            // All tabs already in the correct group — count them but skip API calls
            tabsGrouped += entries.length;
            groupCount += 1;
            continue;
        }

        try {
            if (existingGroupId != null) {
                // Add to existing group
                for (const entry of tabsToMove) {
                    await addToExistingGroup(existingGroupId, entry.tab.id!);
                }
            } else {
                // Create new group with all planned tab IDs
                const tabIds = tabsToMove.map(e => e.tab.id!);
                await createNewGroup(tabIds, targetName, groupColor);
                groupCount += 1;
            }

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
