export {};

declare global {
    var middleClickedTabs: Map<string, number> | undefined;
    var processGroupingForNewTab: (openerTab: import('wxt/browser').Browser.tabs.Tab, newTab: import('wxt/browser').Browser.tabs.Tab) => Promise<void>;
    var handleOrganizeAllTabs: (windowId: number) => Promise<void>;
    var executeNotificationUndoById: (notificationId: string) => Promise<boolean>;
    var shouldSkipDeduplication: (url: string) => boolean;
}
