import { browser } from 'wxt/browser';
import { logger } from '@/utils/logger.js';
import { markDiscovered } from '@/exploration/progressStore.js';

/**
 * Detection of the "pin the extension" capability (`nav.pinExtension`).
 *
 * The user pins the toolbar icon through the browser's own extensions menu,
 * outside any extension page, so this is a `derivation`: we observe the pinned
 * state rather than intercept a click. `getUserSettings().isOnToolbar` exposes
 * it on both Chromium (`action`, MV3) and Firefox (`browserAction`, MV2), and
 * `onUserSettingsChanged` streams live pin/unpin changes when the browser
 * implements it. We always do an initial probe (cheap, re-runs on every service
 * worker wake) and additionally subscribe to the event when present.
 */

interface UserSettings {
  isOnToolbar?: boolean;
}

interface PinAwareAction {
  getUserSettings?: () => Promise<UserSettings>;
  onUserSettingsChanged?: {
    addListener: (listener: (change: UserSettings, isOnToolbar?: boolean) => void) => void;
  };
}

// Firefox MV2 exposes `browser.browserAction`; Chromium MV3 and Firefox MV3
// expose `browser.action`. Probe both, mirroring `actionBadge.getActionApi`.
function getPinAwareAction(): PinAwareAction | undefined {
  const candidate = browser as unknown as { action?: PinAwareAction; browserAction?: PinAwareAction };
  return candidate.action ?? candidate.browserAction;
}

async function probePinned(api: PinAwareAction): Promise<void> {
  if (typeof api.getUserSettings !== 'function') return;
  try {
    const settings = await api.getUserSettings();
    if (settings?.isOnToolbar) void markDiscovered('nav.pinExtension');
  } catch (e) {
    logger.debug('[PIN_DETECT] getUserSettings unavailable:', e);
  }
}

/**
 * Wires the pin-state detection. Safe to call on every background startup;
 * idempotent (the mark is a no-op once recorded) and degrades to a no-op when
 * the browser exposes neither the getter nor the event.
 */
export function setupPinDetection(): void {
  const api = getPinAwareAction();
  if (!api) return;

  void probePinned(api);

  const event = api.onUserSettingsChanged;
  if (!event || typeof event.addListener !== 'function') return;
  event.addListener((change, isOnToolbar) => {
    // Chromium passes a single `{ isOnToolbar }` object; Firefox passes
    // `(change, isOnToolbar)`. Accept both shapes.
    const pinned = typeof isOnToolbar === 'boolean' ? isOnToolbar : change?.isOnToolbar;
    if (pinned) void markDiscovered('nav.pinExtension');
  });
}
