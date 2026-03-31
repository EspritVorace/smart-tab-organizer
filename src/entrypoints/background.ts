import { defineBackground } from 'wxt/utils/define-background';
import { setupAllEventHandlers } from '../background/event-handlers.js';
import { logger } from '../utils/logger.js';
import { startPeriodicCleanup } from '../background/deduplication.js';
import { initNotificationListeners, executeNotificationUndoById } from '../utils/notifications.js';
import { middleClickedTabs } from '../background/messaging.js';
import { processGroupingForNewTab } from '../background/grouping.js';
import { handleOrganizeAllTabs } from '../background/organize.js';
export default defineBackground(() => {
    // Initialize all event handlers
    setupAllEventHandlers();

    // Start periodic cleanup for deduplication cache
    startPeriodicCleanup();

    // Initialize notification button click listeners
    initNotificationListeners();

    // Expose functions for E2E testing
    (globalThis as any).middleClickedTabs = middleClickedTabs;
    (globalThis as any).processGroupingForNewTab = processGroupingForNewTab;
    (globalThis as any).handleOrganizeAllTabs = handleOrganizeAllTabs;
    (globalThis as any).executeNotificationUndoById = executeNotificationUndoById;

    logger.debug("SmartTab Organizer Service Worker: Initialized with modular architecture.");
});
