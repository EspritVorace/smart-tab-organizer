import { defineBackground } from 'wxt/utils/define-background';
import { setupAllEventHandlers } from '../background/event-handlers.js';
import { startPeriodicCleanup } from '../background/deduplication.js';
import { initNotificationListeners } from '../utils/notifications.js';

export default defineBackground(() => {
    // Initialize all event handlers
    setupAllEventHandlers();

    // Start periodic cleanup for deduplication cache
    startPeriodicCleanup();

    // Initialize notification button click listeners
    initNotificationListeners();

    console.log("SmartTab Organizer Service Worker: Initialized with modular architecture.");
});
