import { beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';

// Reset fake browser state before each test
beforeEach(() => {
  fakeBrowser.reset();
});