import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  loadSessions,
  saveSessions,
  addSession,
  updateSession,
  deleteSession,
  batchUpdateSessionPositions,
  reorderSessions,
} from '../src/utils/sessionStorage';
import type { Session } from '../src/types/session';

function makeSession(overrides: Partial<Session> = {}): Session {
  const now = new Date().toISOString();
  return {
    id: `id-${Math.random().toString(36).slice(2, 10)}`,
    name: 'Test session',
    createdAt: now,
    updatedAt: now,
    groups: [],
    ungroupedTabs: [
      { id: `tab-${Math.random().toString(36).slice(2, 10)}`, title: 'Example', url: 'https://example.com' },
    ],
    isPinned: false,
    categoryId: null,
    ...overrides,
  };
}

beforeEach(() => {
  fakeBrowser.reset();
});

describe('loadSessions', () => {
  it('returns an empty array when storage is empty', async () => {
    expect(await loadSessions()).toEqual([]);
  });

  it('returns sessions that pass Zod validation', async () => {
    const session = makeSession({ name: 'Alpha' });
    await fakeBrowser.storage.local.set({ sessions: [session] });
    const loaded = await loadSessions();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe('Alpha');
  });

  it('returns [] when stored data fails Zod validation', async () => {
    // Missing required fields → validation fails
    await fakeBrowser.storage.local.set({ sessions: [{ id: 'x', name: 'Broken' }] });
    expect(await loadSessions()).toEqual([]);
  });

  it('supports sessions with moz-extension URLs stored (no hard filter at load time)', async () => {
    // Filtering happens at capture time; the store must still load anything valid.
    const session = makeSession({
      ungroupedTabs: [
        { id: 'tab-1', title: 'Options', url: 'moz-extension://abcd/options.html' },
      ],
    });
    await fakeBrowser.storage.local.set({ sessions: [session] });
    expect(await loadSessions()).toHaveLength(1);
  });
});

describe('saveSessions', () => {
  it('writes sessions to local storage', async () => {
    const sessions = [makeSession({ name: 'A' }), makeSession({ name: 'B' })];
    await saveSessions(sessions);
    const { sessions: stored } = await fakeBrowser.storage.local.get('sessions');
    expect(stored).toHaveLength(2);
  });

  it('overwrites previous sessions entirely', async () => {
    await saveSessions([makeSession({ name: 'Old' })]);
    await saveSessions([makeSession({ name: 'New' })]);
    const loaded = await loadSessions();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe('New');
  });
});

describe('addSession', () => {
  it('appends a session without losing existing ones', async () => {
    await addSession(makeSession({ name: 'First' }));
    await addSession(makeSession({ name: 'Second' }));
    const loaded = await loadSessions();
    expect(loaded.map(s => s.name)).toEqual(['First', 'Second']);
  });

  it('persists a pinned session (popup relies on isPinned being stored)', async () => {
    // Regression guard for the "pinned sessions don't appear in popup" bug:
    // ensures isPinned survives the round-trip through storage + Zod.
    await addSession(makeSession({ name: 'Pinned', isPinned: true }));
    const [loaded] = await loadSessions();
    expect(loaded.isPinned).toBe(true);
  });
});

describe('updateSession', () => {
  it('updates fields and refreshes updatedAt', async () => {
    const session = makeSession({ name: 'Before', updatedAt: '2020-01-01T00:00:00.000Z' });
    await saveSessions([session]);
    await updateSession(session.id, { name: 'After' });
    const [updated] = await loadSessions();
    expect(updated.name).toBe('After');
    expect(updated.updatedAt).not.toBe('2020-01-01T00:00:00.000Z');
  });

  it('is a no-op when the session ID is unknown', async () => {
    await saveSessions([makeSession({ id: 'a' })]);
    await updateSession('missing', { name: 'Ghost' });
    const sessions = await loadSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe('a');
  });

  it('can toggle isPinned from false to true and back', async () => {
    const session = makeSession({ isPinned: false });
    await saveSessions([session]);
    await updateSession(session.id, { isPinned: true });
    expect((await loadSessions())[0].isPinned).toBe(true);
    await updateSession(session.id, { isPinned: false });
    expect((await loadSessions())[0].isPinned).toBe(false);
  });
});

describe('deleteSession', () => {
  it('removes the matching session only', async () => {
    const a = makeSession({ id: 'a' });
    const b = makeSession({ id: 'b' });
    await saveSessions([a, b]);
    await deleteSession('a');
    const remaining = await loadSessions();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('b');
  });

  it('is a no-op when the ID does not exist', async () => {
    await saveSessions([makeSession({ id: 'a' })]);
    await deleteSession('missing');
    expect(await loadSessions()).toHaveLength(1);
  });
});

describe('batchUpdateSessionPositions', () => {
  it('applies multiple position updates in a single write', async () => {
    const a = makeSession({ id: 'a', position: 0 });
    const b = makeSession({ id: 'b', position: 1 });
    const c = makeSession({ id: 'c', position: 2 });
    await saveSessions([a, b, c]);
    await batchUpdateSessionPositions([
      { id: 'a', position: 2 },
      { id: 'c', position: 0 },
    ]);
    const loaded = await loadSessions();
    const byId = Object.fromEntries(loaded.map(s => [s.id, s.position]));
    expect(byId.a).toBe(2);
    expect(byId.b).toBe(1);
    expect(byId.c).toBe(0);
  });

  it('leaves sessions not in the update list untouched', async () => {
    await saveSessions([
      makeSession({ id: 'a', position: 5 }),
      makeSession({ id: 'b', position: 6 }),
    ]);
    await batchUpdateSessionPositions([{ id: 'a', position: 0 }]);
    const loaded = await loadSessions();
    expect(loaded.find(s => s.id === 'b')?.position).toBe(6);
  });
});

describe('reorderSessions', () => {
  it('rebuilds full session data in the new order using stored values', async () => {
    const a = makeSession({ id: 'a', name: 'Alpha' });
    const b = makeSession({ id: 'b', name: 'Bravo' });
    const c = makeSession({ id: 'c', name: 'Charlie' });
    await saveSessions([a, b, c]);

    // Pass in minimal shapes to prove reorderSessions enriches from storage
    await reorderSessions([
      { id: 'c' } as Session,
      { id: 'a' } as Session,
      { id: 'b' } as Session,
    ]);

    const loaded = await loadSessions();
    expect(loaded.map(s => s.id)).toEqual(['c', 'a', 'b']);
    expect(loaded.map(s => s.name)).toEqual(['Charlie', 'Alpha', 'Bravo']);
  });

  it('appends sessions not present in the ordered list to the end', async () => {
    const a = makeSession({ id: 'a' });
    const b = makeSession({ id: 'b' });
    const c = makeSession({ id: 'c' });
    await saveSessions([a, b, c]);

    await reorderSessions([{ id: 'b' } as Session]);

    const loaded = await loadSessions();
    expect(loaded.map(s => s.id)).toEqual(['b', 'a', 'c']);
  });
});
