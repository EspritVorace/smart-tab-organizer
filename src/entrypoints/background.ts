import { defineBackground } from 'wxt/utils/define-background';
import { setupAllEventHandlers } from '../background/event-handlers.js';
import { startPeriodicCleanup } from '../background/deduplication.js';
import { initNotificationListeners } from '../utils/notifications.js';
import { middleClickedTabs } from '../background/messaging.js';
import { processGroupingForNewTab } from '../background/grouping.js';
import { initProfileSync } from '../background/profileSync.js';

export default defineBackground(() => {
    // Initialize all event handlers
    setupAllEventHandlers();

    // Initialize auto-sync for profiles
    initProfileSync();

    // Start periodic cleanup for deduplication cache
    startPeriodicCleanup();

    // Initialize notification button click listeners
    initNotificationListeners();

    // Expose functions for E2E testing
    (globalThis as any).middleClickedTabs = middleClickedTabs;
    (globalThis as any).processGroupingForNewTab = processGroupingForNewTab;

    console.log("SmartTab Organizer Service Worker: Initialized with modular architecture.");
});
