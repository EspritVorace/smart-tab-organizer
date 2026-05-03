import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';

beforeEach(() => {
  fakeBrowser.reset();
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('getShortcutsCustomizeInfo', () => {
  it('returns the Chromium URL when FIREFOX env is unset/empty', async () => {
    vi.stubEnv('FIREFOX', '');
    const { getShortcutsCustomizeInfo } = await import('../../src/utils/browserUrls');

    expect(getShortcutsCustomizeInfo()).toEqual({
      url: 'chrome://extensions/shortcuts',
      isDirect: true,
    });
  });

  it('returns about:addons with isDirect=false on Firefox', async () => {
    vi.stubEnv('FIREFOX', '1');
    const { getShortcutsCustomizeInfo } = await import('../../src/utils/browserUrls');

    expect(getShortcutsCustomizeInfo()).toEqual({
      url: 'about:addons',
      isDirect: false,
    });
  });
});

describe('openShortcutsCustomizePage', () => {
  it('opens chrome://extensions/shortcuts on Chromium', async () => {
    vi.stubEnv('FIREFOX', '');
    const createMock = vi.spyOn(fakeBrowser.tabs, 'create').mockResolvedValue({} as never);
    const { openShortcutsCustomizePage } = await import('../../src/utils/browserUrls');

    await openShortcutsCustomizePage();

    expect(createMock).toHaveBeenCalledWith({ url: 'chrome://extensions/shortcuts' });
  });

  it('opens about:addons on Firefox', async () => {
    vi.stubEnv('FIREFOX', '1');
    const createMock = vi.spyOn(fakeBrowser.tabs, 'create').mockResolvedValue({} as never);
    const { openShortcutsCustomizePage } = await import('../../src/utils/browserUrls');

    await openShortcutsCustomizePage();

    expect(createMock).toHaveBeenCalledWith({ url: 'about:addons' });
  });
});
