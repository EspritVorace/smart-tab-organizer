import { browser, Browser } from 'wxt/browser';
import { getMessage } from './i18n';
import { markUrlToSkipDeduplication } from './deduplicationSkip';

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
export async function showNotification({ title, message, type = 'info', undoAction }: ShowNotificationOptions): Promise<string> {
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

  await browser.notifications.create(notificationId, notificationOptions);

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
          console.log(`[UNDO] Ungrouped tabs: ${data.tabIds.join(', ')}`);
        }
        break;
      }
      case 'reopen_tab': {
        const data = action.data as ReopenTabUndoData;
        // Mark URL to skip deduplication so it won't be immediately closed again
        markUrlToSkipDeduplication(data.url);
        await browser.tabs.create({
          url: data.url,
          windowId: data.windowId,
          active: true
        });
        console.log(`[UNDO] Reopened tab: ${data.url}`);
        break;
      }
    }
  } catch (error) {
    console.error('[UNDO] Error executing undo action:', error);
  }
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
