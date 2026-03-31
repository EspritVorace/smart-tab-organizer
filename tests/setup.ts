import { vi, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';

// Expose fakeBrowser as global browser/chrome (mirrors extensionApiMock)
vi.stubGlobal('browser', fakeBrowser);
vi.stubGlobal('chrome', fakeBrowser);

// Reset fake browser state before each test
beforeEach(() => {
  fakeBrowser.reset();
});