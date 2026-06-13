import { browser } from 'wxt/browser';
import { logger } from '@/utils/logger.js';
import { markDiscovered } from '@/exploration/progressStore.js';
import { getSettings, watchSettingsField } from '@/utils/settingsUtils.js';
import { initWorkspaceContext } from '@/utils/workspaceContext.js';
import { activeWorkspaceIdItem } from '@/utils/workspaceStorage.js';

/**
 * State of the toolbar badge driven by the global grouping/deduplication
 * toggles. Letters are kept locale-independent on purpose: `G` for Grouping,
 * `D` for Deduplication, `X` when both are off.
 */
export interface ActionBadgeState {
  readonly text: string;
  readonly color: string;
}

const BADGE_NONE: ActionBadgeState = { text: '', color: '#00000000' };
const BADGE_GROUPING_OFF: ActionBadgeState = { text: 'G', color: '#F76B15' };
const BADGE_DEDUP_OFF: ActionBadgeState = { text: 'D', color: '#F76B15' };
const BADGE_BOTH_OFF: ActionBadgeState = { text: 'X', color: '#E5484D' };

export function computeBadge(
  groupingEnabled: boolean,
  deduplicationEnabled: boolean,
): ActionBadgeState {
  if (groupingEnabled && deduplicationEnabled) return BADGE_NONE;
  if (!groupingEnabled && !deduplicationEnabled) return BADGE_BOTH_OFF;
  if (!groupingEnabled) return BADGE_GROUPING_OFF;
  return BADGE_DEDUP_OFF;
}

interface ActionLike {
  setBadgeText: (details: { text: string }) => Promise<void> | void;
  setBadgeBackgroundColor: (details: { color: string }) => Promise<void> | void;
}

// Firefox MV2 only exposes `browser.browserAction`; Chromium MV3 and
// Firefox MV3 both expose `browser.action`. Probe both so the badge works
// on every supported target.
function getActionApi(): ActionLike | undefined {
  const candidate = browser as unknown as { action?: ActionLike; browserAction?: ActionLike };
  return candidate.action ?? candidate.browserAction;
}

export async function applyActionBadge(state: ActionBadgeState): Promise<void> {
  const api = getActionApi();
  if (!api) {
    logger.debug('[ACTION_BADGE] browser.action API unavailable, skipping.');
    return;
  }
  try {
    await api.setBadgeText({ text: state.text });
    if (state.text !== '') {
      await api.setBadgeBackgroundColor({ color: state.color });
      // Exploration: a non-empty badge means a toggle is off and the indicator
      // is visible to the user (derivation from observed state).
      void markDiscovered('settings.badge');
    }
  } catch (e) {
    logger.error('[ACTION_BADGE] Failed to apply badge:', e);
  }
}

export async function updateActionBadge(): Promise<void> {
  const settings = await getSettings();
  await applyActionBadge(
    computeBadge(settings.globalGroupingEnabled, settings.globalDeduplicationEnabled),
  );
}

function subscribeToCurrentWorkspaceSettings(): () => void {
  const unwatchGrouping = watchSettingsField('globalGroupingEnabled', () => {
    void updateActionBadge();
  });
  const unwatchDedup = watchSettingsField('globalDeduplicationEnabled', () => {
    void updateActionBadge();
  });
  return () => {
    unwatchGrouping();
    unwatchDedup();
  };
}

/**
 * Renders the initial badge, then keeps it in sync with the active
 * workspace's settings. Re-subscribes when the active workspace changes
 * because `watchSettingsField` binds to the workspace items resolved at
 * subscription time.
 */
export async function setupActionBadge(): Promise<() => void> {
  await initWorkspaceContext();
  await updateActionBadge();

  let teardownSettingsWatchers = subscribeToCurrentWorkspaceSettings();
  const unwatchWorkspace = activeWorkspaceIdItem.watch(() => {
    teardownSettingsWatchers();
    teardownSettingsWatchers = subscribeToCurrentWorkspaceSettings();
    void updateActionBadge();
  });

  return () => {
    teardownSettingsWatchers();
    unwatchWorkspace();
  };
}
