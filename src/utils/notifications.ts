import { browser } from 'wxt/browser';

export type NotificationType = 'success' | 'error' | 'info';

interface ShowNotificationOptions {
  title: string;
  message: string;
  type?: NotificationType;
}

/**
 * Shows a native browser notification
 */
export async function showNotification({ title, message, type = 'info' }: ShowNotificationOptions): Promise<string> {
  const notificationId = `smarttab-${Date.now()}`;

  await browser.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: browser.runtime.getURL('icons/icon128.png'),
    title,
    message
  });

  // Auto-clear after 5 seconds
  setTimeout(() => {
    browser.notifications.clear(notificationId);
  }, 5000);

  return notificationId;
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
