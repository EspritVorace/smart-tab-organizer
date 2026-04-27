import type { Browser } from 'wxt/browser';

export interface ChromeTabGroup {
  id: number;
  title?: string;
  color?: string;
  collapsed?: boolean;
  windowId?: number;
}

export interface ChromeTabGroupsExtended {
  query: (filter: { windowId?: number; collapsed?: boolean }) => Promise<ChromeTabGroup[]>;
  move: (groupId: number, props: { index: number; windowId?: number }) => Promise<ChromeTabGroup>;
  get: (groupId: number) => Promise<ChromeTabGroup>;
}

export type ChromeTab = Browser.tabs.Tab & { groupId?: number };

export interface ChromeNotificationOptions {
  type: string;
  iconUrl: string;
  title: string;
  message: string;
  buttons?: Array<{ title: string }>;
}

export interface ChromeNotificationsAPI {
  create: (options: ChromeNotificationOptions) => void;
}
