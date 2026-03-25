import { browser } from 'wxt/browser';
import { loadSessions, updateSession } from '../utils/sessionStorage.js';
import { logger } from '../utils/logger.js';
import { getProfileWindowMap } from '../utils/profileWindowMap.js';
import { generateUUID } from '../utils/utils.js';
import type { SavedTab, SavedTabGroup } from '../types/session';
import {
  profileSyncDraftsItem,
  editingProfileIdItem,
  sessionsItem,
} from '../utils/storageItems.js';

const ALARM_NAME = 'auto-sync-profiles';

export interface SyncDraft {
  profileId: string;
  groups: SavedTabGroup[];
  ungroupedTabs: SavedTab[];
  capturedAt: string;
}

export type SyncDraftsMap = Record<string, SyncDraft>;

// --- Storage helpers ---

export async function getSyncDrafts(): Promise<SyncDraftsMap> {
  return profileSyncDraftsItem.getValue();
}

export async function saveSyncDrafts(drafts: SyncDraftsMap): Promise<void> {
  await profileSyncDraftsItem.setValue(drafts);
}

async function getEditingProfileId(): Promise<string | null> {
  return editingProfileIdItem.getValue();
}

// --- Tab capture for a specific window ---

const SYSTEM_URL_PREFIXES = ['chrome://', 'chrome-extension://', 'about:', 'edge://'];
const VALID_COLORS = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];

function isSystemUrl(url: string | undefined): boolean {
  if (!url) return true;
  return SYSTEM_URL_PREFIXES.some(p => url.startsWith(p));
}

function normalizeColor(color: string | undefined): string {
  return color && VALID_COLORS.includes(color) ? color : 'grey';
}

interface CaptureWindowResult {
  groups: SavedTabGroup[];
  ungroupedTabs: SavedTab[];
}

async function captureWindowTabs(windowId: number): Promise<CaptureWindowResult> {
  const tabs = await browser.tabs.query({ windowId });
  tabs.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  const seenGroupIds = new Set<number>();
  for (const tab of tabs) {
    const groupId = (tab as any).groupId;
    if (typeof groupId === 'number' && groupId >= 0) seenGroupIds.add(groupId);
  }

  const groupMap = new Map<number, SavedTabGroup>();
  for (const groupId of seenGroupIds) {
    try {
      const group = await (browser.tabGroups as any).get(groupId);
      groupMap.set(groupId, {
        id: generateUUID(),
        title: group.title || '',
        color: normalizeColor(group.color) as SavedTabGroup['color'],
        tabs: [],
      });
    } catch {
      // Group may no longer exist
    }
  }

  const ungroupedTabs: SavedTab[] = [];
  for (const tab of tabs) {
    if (isSystemUrl(tab.url)) continue;
    const savedTab: SavedTab = {
      id: generateUUID(),
      title: tab.title || tab.url || '',
      url: tab.url || '',
      favIconUrl: tab.favIconUrl || undefined,
    };
    const groupId = (tab as any).groupId;
    if (typeof groupId === 'number' && groupId >= 0 && groupMap.has(groupId)) {
      groupMap.get(groupId)!.tabs.push(savedTab);
    } else {
      ungroupedTabs.push(savedTab);
    }
  }

  const groups = Array.from(groupMap.values()).filter(g => g.tabs.length > 0);
  return { groups, ungroupedTabs };
}

// --- Change detection (URL-based, titles change dynamically) ---

function hasTabsChanged(
  current: CaptureWindowResult,
  existingDraft: SyncDraft | undefined,
): boolean {
  if (!existingDraft) return true;

  const currentUrls = new Set([
    ...current.ungroupedTabs.map(t => t.url),
    ...current.groups.flatMap(g => g.tabs.map(t => t.url)),
  ]);
  const draftUrls = new Set([
    ...existingDraft.ungroupedTabs.map(t => t.url),
    ...existingDraft.groups.flatMap(g => g.tabs.map(t => t.url)),
  ]);

  if (currentUrls.size !== draftUrls.size) return true;
  for (const url of currentUrls) {
    if (!draftUrls.has(url)) return true;
  }
  return false;
}

// --- Core sync functions ---

/**
 * For each auto-sync profile with an open window, capture tabs and update the
 * in-memory draft (session storage). The persisted profile is NOT touched.
 */
export async function updateSyncDrafts(): Promise<void> {
  const sessions = await loadSessions();
  const profiles = sessions.filter(s => s.isPinned);
  if (profiles.length === 0) return;

  const windowMap = await getProfileWindowMap();
  const drafts = await getSyncDrafts();
  let changed = false;

  for (const profile of profiles) {
    const windowId = windowMap[profile.id];
    if (windowId == null) continue;

    // Verify the window still exists
    try {
      await browser.windows.get(windowId);
    } catch {
      continue;
    }

    const captured = await captureWindowTabs(windowId);
    if (!hasTabsChanged(captured, drafts[profile.id])) continue;

    drafts[profile.id] = {
      profileId: profile.id,
      groups: captured.groups,
      ungroupedTabs: captured.ungroupedTabs,
      capturedAt: new Date().toISOString(),
    };
    changed = true;
  }

  if (changed) await saveSyncDrafts(drafts);
}

/**
 * Persist the in-memory draft for a profile to local storage.
 * Called when the associated window is closed.
 * Skips if the user is currently editing the profile.
 */
export async function persistSyncDraft(profileId: string): Promise<void> {
  // Guard: don't overwrite while the user has the edit dialog open
  const editingId = await getEditingProfileId();
  if (editingId === profileId) {
    logger.debug(`[AUTO_SYNC] Skipping persist for ${profileId}: edit dialog is open`);
    return;
  }

  const drafts = await getSyncDrafts();
  const draft = drafts[profileId];
  if (!draft) return;

  await updateSession(profileId, {
    groups: draft.groups,
    ungroupedTabs: draft.ungroupedTabs,
  });

  delete drafts[profileId];
  await saveSyncDrafts(drafts);
  logger.debug(`[AUTO_SYNC] Persisted draft for profile ${profileId}`);
}

// --- Alarm management ---

/**
 * Create or clear the periodic alarm depending on whether any pinned profile exists.
 * Safe to call repeatedly — it's idempotent.
 */
export async function updateSyncAlarm(): Promise<void> {
  const sessions = await loadSessions();
  const hasAutoSync = sessions.some(s => s.isPinned);

  if (hasAutoSync) {
    const existing = await (browser.alarms as any).get(ALARM_NAME);
    if (!existing) {
      (browser.alarms as any).create(ALARM_NAME, { periodInMinutes: 5 });
      logger.debug('[AUTO_SYNC] Alarm created');
    }
  } else {
    await (browser.alarms as any).clear(ALARM_NAME);
    logger.debug('[AUTO_SYNC] Alarm cleared (no auto-sync profiles)');
  }
}

// --- Initialization ---

/**
 * Register the alarm listener and perform initial alarm setup.
 * Must be called at the top level of the service worker (not inside another callback).
 */
export function initProfileSync(): void {
  // Listen for the periodic alarm
  (browser.alarms as any).onAlarm.addListener(async (alarm: { name: string }) => {
    if (alarm.name === ALARM_NAME) {
      await updateSyncDrafts().catch(e =>
        logger.error('[AUTO_SYNC] Error updating drafts:', e),
      );
    }
  });

  // Re-evaluate the alarm whenever sessions change (covers create, update, delete)
  sessionsItem.watch(() => {
    updateSyncAlarm().catch(e =>
      logger.error('[AUTO_SYNC] Error updating alarm:', e),
    );
  });

  // Set initial alarm state based on current sessions
  updateSyncAlarm().catch(e =>
    logger.error('[AUTO_SYNC] Error initializing alarm:', e),
  );
}
