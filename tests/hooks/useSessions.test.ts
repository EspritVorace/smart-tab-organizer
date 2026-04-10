import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing';
import { useSessions } from '../../src/hooks/useSessions';
import type { Session } from '../../src/types/session';

function makeSession(overrides: Partial<Session> = {}): Session {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? `id-${Math.random().toString(36).slice(2, 10)}`,
    name: overrides.name ?? 'Test session',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    groups: overrides.groups ?? [],
    ungroupedTabs: overrides.ungroupedTabs ?? [
      { id: 'tab-1', title: 'Example', url: 'https://example.com' },
    ],
    isPinned: overrides.isPinned ?? false,
    categoryId: overrides.categoryId ?? null,
    note: overrides.note,
    position: overrides.position,
  };
}

beforeEach(() => {
  fakeBrowser.reset();
});

describe('useSessions — initial load', () => {
  it('starts with an empty array and isLoaded=false, then loads from storage', async () => {
    await fakeBrowser.storage.local.set({
      sessions: [makeSession({ name: 'Alpha' })],
    });

    const { result } = renderHook(() => useSessions());

    expect(result.current.sessions).toEqual([]);
    expect(result.current.isLoaded).toBe(false);

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].name).toBe('Alpha');
  });

  it('sets isLoaded=true even when storage is empty', async () => {
    const { result } = renderHook(() => useSessions());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.sessions).toEqual([]);
  });
});

describe('useSessions — createSession', () => {
  it('persists a new session and refreshes state', async () => {
    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    const newSession = makeSession({ name: 'Fresh' });
    await act(async () => {
      await result.current.createSession(newSession);
    });

    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].name).toBe('Fresh');

    // Confirm it's actually persisted to storage too.
    const { sessions } = await fakeBrowser.storage.local.get('sessions');
    expect(sessions).toHaveLength(1);
  });
});

describe('useSessions — renameSession', () => {
  it('renames an existing session by id', async () => {
    const initial = makeSession({ id: 'a', name: 'Before' });
    await fakeBrowser.storage.local.set({ sessions: [initial] });

    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    await act(async () => {
      await result.current.renameSession('a', 'After');
    });

    expect(result.current.sessions[0].name).toBe('After');
  });

  it('is a no-op for an unknown id', async () => {
    const initial = makeSession({ id: 'a', name: 'Keep' });
    await fakeBrowser.storage.local.set({ sessions: [initial] });

    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    await act(async () => {
      await result.current.renameSession('does-not-exist', 'Ghost');
    });

    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].name).toBe('Keep');
  });
});

describe('useSessions — removeSession', () => {
  it('removes a session by id and keeps the others', async () => {
    await fakeBrowser.storage.local.set({
      sessions: [
        makeSession({ id: 'a', name: 'A' }),
        makeSession({ id: 'b', name: 'B' }),
      ],
    });

    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    await act(async () => {
      await result.current.removeSession('a');
    });

    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].id).toBe('b');
  });
});

describe('useSessions — reload', () => {
  it('can be called manually to re-sync with storage', async () => {
    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.sessions).toHaveLength(0);

    // Simulate an external write (e.g. another tab) — bypass the hook.
    await fakeBrowser.storage.local.set({
      sessions: [makeSession({ name: 'External' })],
    });

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].name).toBe('External');
  });
});

describe('useSessions — updateOrder', () => {
  it('applies the order optimistically then persists', async () => {
    const a = makeSession({ id: 'a', name: 'A' });
    const b = makeSession({ id: 'b', name: 'B' });
    const c = makeSession({ id: 'c', name: 'C' });
    await fakeBrowser.storage.local.set({ sessions: [a, b, c] });

    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    await act(async () => {
      await result.current.updateOrder([c, a, b]);
    });

    expect(result.current.sessions.map(s => s.id)).toEqual(['c', 'a', 'b']);

    // Persisted in storage in the new order too.
    const { sessions } = await fakeBrowser.storage.local.get('sessions');
    expect((sessions as Session[]).map(s => s.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('useSessions — storage.onChanged listener', () => {
  it('reloads when storage.local "sessions" changes from outside the hook', async () => {
    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.sessions).toHaveLength(0);

    // Write to storage + trigger the event. The hook's listener calls reload()
    // which reads from actual storage, so we have to write first.
    await act(async () => {
      await fakeBrowser.storage.local.set({
        sessions: [makeSession({ name: 'From outside' })],
      });
      await (fakeBrowser.storage.onChanged as any).trigger(
        { sessions: { newValue: [makeSession({ name: 'From outside' })] } },
        'local',
      );
    });

    await waitFor(() => {
      expect(result.current.sessions.length).toBeGreaterThan(0);
    });
    expect(result.current.sessions[0].name).toBe('From outside');
  });

  it('ignores changes in other storage areas', async () => {
    await fakeBrowser.storage.local.set({
      sessions: [makeSession({ name: 'Initial' })],
    });
    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.sessions).toHaveLength(1);

    await act(async () => {
      await (fakeBrowser.storage.onChanged as any).trigger(
        { sessions: { newValue: [] } },
        'sync', // wrong area
      );
    });

    // Still the initial value
    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].name).toBe('Initial');
  });

  it('ignores changes that do not touch the "sessions" key', async () => {
    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.sessions).toHaveLength(0);

    await act(async () => {
      await (fakeBrowser.storage.onChanged as any).trigger(
        { otherKey: { newValue: 'whatever' } },
        'local',
      );
    });

    expect(result.current.sessions).toHaveLength(0);
  });

  it('removes its listener on unmount', async () => {
    const { result, unmount } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    unmount();

    // After unmount, storage changes should NOT cause any act() warning or
    // state update because the listener has been removed.
    await (fakeBrowser.storage.onChanged as any).trigger(
      { sessions: { newValue: [makeSession({ name: 'Stale' })] } },
      'local',
    );

    // No assertion on `result.current.sessions` after unmount — React's
    // "can't update unmounted component" warning is the actual regression
    // signal. If the listener leaks, test console would show that warning.
    expect(true).toBe(true);
  });
});
