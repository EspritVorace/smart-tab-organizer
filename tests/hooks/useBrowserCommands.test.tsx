import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing';

vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

beforeEach(() => {
  fakeBrowser.reset();
});

afterEach(() => {
  delete (fakeBrowser as unknown as { commands?: unknown }).commands;
  vi.restoreAllMocks();
});

async function importHook() {
  return await import('../../src/hooks/useBrowserCommands');
}

describe('useBrowserCommands', () => {
  it('returns null synchronously, then resolves with the commands map', async () => {
    (fakeBrowser as unknown as { commands: unknown }).commands = {
      getAll: vi.fn().mockResolvedValue([
        { name: 'organize-all-tabs', shortcut: 'Alt+Shift+O' },
        { name: 'save-current-window-session', shortcut: '' },
      ]),
    };

    const { useBrowserCommands } = await importHook();
    const { result } = renderHook(() => useBrowserCommands());

    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toEqual({
      'organize-all-tabs': 'Alt+Shift+O',
      'save-current-window-session': '',
    });
  });

  it('returns an empty map when browser.commands is unavailable', async () => {
    const { useBrowserCommands } = await importHook();
    const { result } = renderHook(() => useBrowserCommands());

    await waitFor(() => expect(result.current).toEqual({}));
  });

  it('aliases _execute_browser_action to _execute_action when only the former is set', async () => {
    (fakeBrowser as unknown as { commands: unknown }).commands = {
      getAll: vi.fn().mockResolvedValue([
        { name: '_execute_browser_action', shortcut: 'Alt+Shift+P' },
      ]),
    };

    const { useBrowserCommands } = await importHook();
    const { result } = renderHook(() => useBrowserCommands());

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toEqual({
      _execute_browser_action: 'Alt+Shift+P',
      _execute_action: 'Alt+Shift+P',
    });
  });

  it('does not overwrite an existing _execute_action with the alias', async () => {
    (fakeBrowser as unknown as { commands: unknown }).commands = {
      getAll: vi.fn().mockResolvedValue([
        { name: '_execute_action', shortcut: 'Alt+Shift+P' },
        { name: '_execute_browser_action', shortcut: 'Alt+Shift+X' },
      ]),
    };

    const { useBrowserCommands } = await importHook();
    const { result } = renderHook(() => useBrowserCommands());

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?._execute_action).toBe('Alt+Shift+P');
  });

  it('skips entries without a name', async () => {
    (fakeBrowser as unknown as { commands: unknown }).commands = {
      getAll: vi.fn().mockResolvedValue([
        { name: undefined, shortcut: 'X' },
        { name: 'organize-all-tabs', shortcut: 'Y' },
      ]),
    };

    const { useBrowserCommands } = await importHook();
    const { result } = renderHook(() => useBrowserCommands());

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toEqual({ 'organize-all-tabs': 'Y' });
  });

  it('falls back to empty map when getAll rejects', async () => {
    (fakeBrowser as unknown as { commands: unknown }).commands = {
      getAll: vi.fn().mockRejectedValue(new Error('boom')),
    };

    const { useBrowserCommands } = await importHook();
    const { result } = renderHook(() => useBrowserCommands());

    await waitFor(() => expect(result.current).toEqual({}));
  });

  it('does not call setState after unmount', async () => {
    let resolveGetAll: (value: unknown) => void = () => {};
    (fakeBrowser as unknown as { commands: unknown }).commands = {
      getAll: vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveGetAll = resolve;
        }),
      ),
    };

    const { useBrowserCommands } = await importHook();
    const { result, unmount } = renderHook(() => useBrowserCommands());

    expect(result.current).toBeNull();
    unmount();
    resolveGetAll([{ name: 'x', shortcut: 'Y' }]);
    await new Promise((r) => setTimeout(r, 10));
    // No throw / no warning expected; result snapshot stays null at unmount.
    expect(result.current).toBeNull();
  });
});
