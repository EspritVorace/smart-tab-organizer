import { describe, it, expect, beforeEach, vi } from 'vitest';

type Listener = (change: { isOnToolbar?: boolean }, isOnToolbar?: boolean) => void;

const hoisted = vi.hoisted(() => ({
  markDiscovered: vi.fn(async () => undefined),
  // Mutable browser shape, reconfigured per test.
  browser: {} as Record<string, unknown>,
}));

vi.mock('wxt/browser', () => ({
  get browser() {
    return hoisted.browser;
  },
}));

vi.mock('@/exploration/progressStore.js', () => ({
  markDiscovered: hoisted.markDiscovered,
}));

import { setupPinDetection } from '../../src/background/pinDetection';

/** Lets pending microtasks (the fire-and-forget probe) settle. */
const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  vi.clearAllMocks();
  hoisted.browser = {};
});

describe('setupPinDetection', () => {
  it('is a no-op when neither action nor browserAction exists', async () => {
    expect(() => setupPinDetection()).not.toThrow();
    await flush();
    expect(hoisted.markDiscovered).not.toHaveBeenCalled();
  });

  it('marks nav.pinExtension when the initial probe reports the icon pinned', async () => {
    hoisted.browser.action = {
      getUserSettings: vi.fn(async () => ({ isOnToolbar: true })),
    };
    setupPinDetection();
    await flush();
    expect(hoisted.markDiscovered).toHaveBeenCalledWith('nav.pinExtension');
  });

  it('does not mark when the probe reports the icon not pinned', async () => {
    hoisted.browser.action = {
      getUserSettings: vi.fn(async () => ({ isOnToolbar: false })),
    };
    setupPinDetection();
    await flush();
    expect(hoisted.markDiscovered).not.toHaveBeenCalled();
  });

  it('swallows a throwing getUserSettings without marking', async () => {
    hoisted.browser.action = {
      getUserSettings: vi.fn(async () => {
        throw new Error('unavailable');
      }),
    };
    expect(() => setupPinDetection()).not.toThrow();
    await flush();
    expect(hoisted.markDiscovered).not.toHaveBeenCalled();
  });

  it('skips the probe when getUserSettings is not a function', async () => {
    hoisted.browser.action = {};
    setupPinDetection();
    await flush();
    expect(hoisted.markDiscovered).not.toHaveBeenCalled();
  });

  it('falls back to browserAction (Firefox MV2) when action is absent', async () => {
    hoisted.browser.browserAction = {
      getUserSettings: vi.fn(async () => ({ isOnToolbar: true })),
    };
    setupPinDetection();
    await flush();
    expect(hoisted.markDiscovered).toHaveBeenCalledWith('nav.pinExtension');
  });

  it('marks on a live Chromium pin event (single {isOnToolbar} object)', async () => {
    let listener: Listener | undefined;
    hoisted.browser.action = {
      onUserSettingsChanged: {
        addListener: (l: Listener) => {
          listener = l;
        },
      },
    };
    setupPinDetection();
    await flush();
    expect(hoisted.markDiscovered).not.toHaveBeenCalled();

    listener!({ isOnToolbar: true });
    expect(hoisted.markDiscovered).toHaveBeenCalledWith('nav.pinExtension');
  });

  it('marks on a live Firefox pin event (change, isOnToolbar args)', async () => {
    let listener: Listener | undefined;
    hoisted.browser.action = {
      onUserSettingsChanged: {
        addListener: (l: Listener) => {
          listener = l;
        },
      },
    };
    setupPinDetection();

    listener!({}, true);
    expect(hoisted.markDiscovered).toHaveBeenCalledWith('nav.pinExtension');
  });

  it('does not mark when a pin event reports unpinned', async () => {
    let listener: Listener | undefined;
    hoisted.browser.action = {
      onUserSettingsChanged: {
        addListener: (l: Listener) => {
          listener = l;
        },
      },
    };
    setupPinDetection();

    listener!({ isOnToolbar: false });
    listener!({}, false);
    expect(hoisted.markDiscovered).not.toHaveBeenCalled();
  });

  it('only probes when onUserSettingsChanged is missing', async () => {
    hoisted.browser.action = {
      getUserSettings: vi.fn(async () => ({ isOnToolbar: false })),
    };
    expect(() => setupPinDetection()).not.toThrow();
    await flush();
  });
});
