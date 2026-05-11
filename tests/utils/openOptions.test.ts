import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { openOptionsWithHash } from '../../src/utils/openOptions';

beforeEach(() => {
  fakeBrowser.reset();
  vi.restoreAllMocks();
});

describe('openOptionsWithHash', () => {
  it('opens a new tab when no existing options tab is found', async () => {
    const optionsUrl = 'chrome-extension://abc/options.html';
    vi.spyOn(fakeBrowser.runtime, 'getURL').mockReturnValue(optionsUrl as ReturnType<typeof fakeBrowser.runtime.getURL>);
    const queryMock = vi.spyOn(fakeBrowser.tabs, 'query').mockResolvedValue([]);
    const createMock = vi.spyOn(fakeBrowser.tabs, 'create').mockResolvedValue({ id: 1 } as never);

    await openOptionsWithHash('#sessions');

    expect(queryMock).toHaveBeenCalledWith({});
    expect(createMock).toHaveBeenCalledWith({ url: `${optionsUrl}#sessions` });
  });

  it('updates and focuses an existing options tab when present', async () => {
    const optionsUrl = 'chrome-extension://abc/options.html';
    vi.spyOn(fakeBrowser.runtime, 'getURL').mockReturnValue(optionsUrl as ReturnType<typeof fakeBrowser.runtime.getURL>);
    vi.spyOn(fakeBrowser.tabs, 'query').mockResolvedValue([
      { id: 42, url: `${optionsUrl}#oldhash`, windowId: 7 } as never,
    ]);
    const updateTab = vi.spyOn(fakeBrowser.tabs, 'update').mockResolvedValue({} as never);
    const updateWin = vi.spyOn(fakeBrowser.windows, 'update').mockResolvedValue({} as never);
    const createMock = vi.spyOn(fakeBrowser.tabs, 'create');

    await openOptionsWithHash('#stats');

    expect(updateTab).toHaveBeenCalledWith(42, { url: `${optionsUrl}#stats`, active: true });
    expect(updateWin).toHaveBeenCalledWith(7, { focused: true });
    expect(createMock).not.toHaveBeenCalled();
  });

  it('skips windows.update when the existing tab has no windowId', async () => {
    const optionsUrl = 'chrome-extension://abc/options.html';
    vi.spyOn(fakeBrowser.runtime, 'getURL').mockReturnValue(optionsUrl as ReturnType<typeof fakeBrowser.runtime.getURL>);
    vi.spyOn(fakeBrowser.tabs, 'query').mockResolvedValue([
      { id: 9, url: `${optionsUrl}` } as never,
    ]);
    const updateTab = vi.spyOn(fakeBrowser.tabs, 'update').mockResolvedValue({} as never);
    const updateWin = vi.spyOn(fakeBrowser.windows, 'update').mockResolvedValue({} as never);

    await openOptionsWithHash('#x');

    expect(updateTab).toHaveBeenCalled();
    expect(updateWin).not.toHaveBeenCalled();
  });

  it('falls back to creating a tab when the existing tab has no id', async () => {
    const optionsUrl = 'chrome-extension://abc/options.html';
    vi.spyOn(fakeBrowser.runtime, 'getURL').mockReturnValue(optionsUrl as ReturnType<typeof fakeBrowser.runtime.getURL>);
    vi.spyOn(fakeBrowser.tabs, 'query').mockResolvedValue([
      { url: optionsUrl } as never,
    ]);
    const updateTab = vi.spyOn(fakeBrowser.tabs, 'update');
    const createMock = vi.spyOn(fakeBrowser.tabs, 'create').mockResolvedValue({} as never);

    await openOptionsWithHash('#h');

    expect(updateTab).not.toHaveBeenCalled();
    expect(createMock).toHaveBeenCalledWith({ url: `${optionsUrl}#h` });
  });
});
