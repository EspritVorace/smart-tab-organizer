import { browser, Browser } from 'wxt/browser';
import { getMessage } from './i18n';
import { markUrlToSkipDeduplication } from './deduplicationSkip';
import { logger } from './logger';

export type NotificationType = 'success' | 'error' | 'info';

export type UndoActionType = 'ungroup' | 'reopen_tab';

export interface UndoAction {
  type: UndoActionType;
  data: UngroupUndoData | ReopenTabUndoData;
}

export interface UngroupUndoData {
  tabIds: number[];
}

export interface ReopenTabUndoData {
  url: string;
  windowId: number;
  groupId?: number;
  title?: string;
  index?: number;
}

interface ShowNotificationOptions {
  title: string;
  message: string;
  type?: NotificationType;
  undoAction?: UndoAction;
}

// Store pending undo actions by notification ID
const pendingUndoActions = new Map<string, UndoAction>();

/**
 * Shows a native browser notification with optional undo button
 */
export async function showNotification({ title, message, type: _type = 'info', undoAction }: ShowNotificationOptions): Promise<string> {
  const notificationId = `smarttab-${Date.now()}`;

  const notificationOptions: Browser.notifications.NotificationCreateOptions = {
    type: 'basic',
    iconUrl: browser.runtime.getURL('/icons/icon128.png'),
    title,
    message
  };

  // Add undo button if action provided
  if (undoAction) {
    notificationOptions.buttons = [
      { title: getMessage('undoAction') }
    ];
    pendingUndoActions.set(notificationId, undoAction);
  }

  try {
    await browser.notifications.create(notificationId, notificationOptions);
  } catch {
    // Firefox does not support the `buttons` property — retry without it
    delete notificationOptions.buttons;
    await browser.notifications.create(notificationId, notificationOptions);
  }

  // Auto-clear after 5 seconds
  setTimeout(() => {
    browser.notifications.clear(notificationId);
    pendingUndoActions.delete(notificationId);
  }, 5000);

  return notificationId;
}

/**
 * Initialize notification button click listener
 * Call this once in the background script
 */
export function initNotificationListeners(): void {
  browser.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
    if (buttonIndex === 0) { // Undo button
      const action = pendingUndoActions.get(notificationId);
      if (action) {
        await executeUndoAction(action);
        pendingUndoActions.delete(notificationId);
        browser.notifications.clear(notificationId);
      }
    }
  });

  // Also handle notification close to clean up
  browser.notifications.onClosed.addListener((notificationId) => {
    pendingUndoActions.delete(notificationId);
  });
}

/**
 * Best-effort re-attachment of a reopened tab to its former group. Falls back
 * to creating a standalone group if the original group no longer exists.
 */
async function restoreTabGroupMembership(tabId: number, groupId: number): Promise<void> {
  const tabGroups = (browser as unknown as { tabGroups?: { get: (id: number) => Promise<unknown> } }).tabGroups;
  try {
    if (tabGroups && typeof tabGroups.get === 'function') {
      await tabGroups.get(groupId);
    }
    await browser.tabs.group({ tabIds: [tabId], groupId });
    logger.debug(`[UNDO] Reattached tab ${tabId} to group ${groupId}`);
  } catch (err) {
    logger.debug(`[UNDO] Original group ${groupId} unavailable, creating a fresh group:`, err);
    try {
      await browser.tabs.group({ tabIds: [tabId] });
    } catch (fallbackErr) {
      logger.warn('[UNDO] Could not re-group reopened tab:', fallbackErr);
    }
  }
}

/**
 * Execute the undo action
 */
async function executeUndoAction(action: UndoAction): Promise<void> {
  try {
    switch (action.type) {
      case 'ungroup': {
        const data = action.data as UngroupUndoData;
        if (data.tabIds.length > 0) {
          // Cast to the expected type for browser.tabs.ungroup
          await browser.tabs.ungroup(data.tabIds as [number, ...number[]]);
          logger.debug(`[UNDO] Ungrouped tabs: ${data.tabIds.join(', ')}`);
        }
        break;
      }
      case 'reopen_tab': {
        const data = action.data as ReopenTabUndoData;
        // Mark URL to skip deduplication so it won't be immediately closed again
        markUrlToSkipDeduplication(data.url);
        const createProps: Browser.tabs.CreateProperties = {
          url: data.url,
          windowId: data.windowId,
          active: true,
        };
        if (typeof data.index === 'number' && data.index >= 0) {
          createProps.index = data.index;
        }
        const created = await browser.tabs.create(createProps);
        logger.debug(`[UNDO] Reopened tab: ${data.url}`);
        if (typeof data.groupId === 'number' && data.groupId > 0 && typeof created.id === 'number') {
          await restoreTabGroupMembership(created.id, data.groupId);
        }
        break;
      }
    }
  } catch (error) {
    logger.error('[UNDO] Error executing undo action:', error);
  }
}

/**
 * Execute the undo action associated with a notification ID.
 * Exposed on globalThis for E2E testing.
 * Returns true if an undo action was found and executed, false otherwise.
 */
export async function executeNotificationUndoById(notificationId: string): Promise<boolean> {
  const action = pendingUndoActions.get(notificationId);
  if (action) {
    await executeUndoAction(action);
    pendingUndoActions.delete(notificationId);
    browser.notifications.clear(notificationId);
    return true;
  }
  return false;
}

/**
 * Shows a success notification
 */
export function showSuccessNotification(title: string, message: string): Promise<string> {
  return showNotification({ title, message, type: 'success' });
}

/**
 * Shows an error notification
 */
export function showErrorNotification(title: string, message: string): Promise<string> {
  return showNotification({ title, message, type: 'error' });
}
