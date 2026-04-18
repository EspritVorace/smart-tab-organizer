import { vi, beforeEach, expect } from 'vitest';
import { fakeBrowser } from 'wxt/testing';

// Expose fakeBrowser as global browser/chrome (mirrors extensionApiMock)
vi.stubGlobal('browser', fakeBrowser);
vi.stubGlobal('chrome', fakeBrowser);

// Reset fake browser state before each test
beforeEach(() => {
  fakeBrowser.reset();
});

// toHaveBeenCalledExactlyOnceWith n'existe pas dans vitest 2.x
expect.extend({
  toHaveBeenCalledExactlyOnceWith(
    received: { mock: { calls: unknown[][] } },
    ...expected: unknown[]
  ) {
    const calls = received.mock.calls;
    if (calls.length !== 1) {
      return {
        pass: false,
        message: () =>
          `Expected mock to be called exactly once, but was called ${calls.length} time(s).`,
      };
    }
    const pass = this.equals(calls[0], expected);
    return {
      pass,
      message: () =>
        pass
          ? `Expected mock not to be called exactly once with ${JSON.stringify(expected)}.`
          : `Expected mock to be called with ${JSON.stringify(expected)}, but received ${JSON.stringify(calls[0])}.`,
    };
  },
});

declare module 'vitest' {
  interface Assertion {
    toHaveBeenCalledExactlyOnceWith(...args: unknown[]): void;
  }
}