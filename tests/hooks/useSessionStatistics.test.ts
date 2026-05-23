import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing';
import { useSessionStatistics } from '../../src/hooks/useSessionStatistics';
import type { Session } from '../../src/types/session';

function makeSession(overrides: Partial<Session> = {}): Session {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? `id-${Math.random().toString(36).slice(2, 10)}`,
    name: overrides.name ?? 'Test session',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    groups: overrides.groups ?? [],
    ungroupedTabs: overrides.ungroupedTabs ?? [],
    isPinned: overrides.isPinned ?? false,
    isArchived: overrides.isArchived,
    categoryId: overrides.categoryId ?? null,
    note: overrides.note,
    position: overrides.position,
  };
}

beforeEach(() => {
  fakeBrowser.reset();
});

describe('useSessionStatistics — volumes', () => {
  it('returns zeroed volumes when no sessions exist', async () => {
    const { result } = renderHook(() => useSessionStatistics());

    await waitFor(() => {
      expect(result.current.snapshot.isLoaded).toBe(true);
    });

    expect(result.current.snapshot.volumes.total).toBe(0);
    expect(result.current.snapshot.volumes.totalTabs).toBe(0);
    expect(result.current.snapshot.volumes.largest).toBeNull();
  });

  it('splits counts across the three buckets and includes archived in total', async () => {
    await fakeBrowser.storage.local.set({
      pinnedSessions: [makeSession({ name: 'P1', isPinned: true })],
      sessions: [makeSession({ name: 'A1' }), makeSession({ name: 'A2' })],
      archivedSessions: [
        makeSession({ name: 'Arch1', isArchived: true }),
        makeSession({ name: 'Arch2', isArchived: true }),
        makeSession({ name: 'Arch3', isArchived: true }),
      ],
    });

    const { result } = renderHook(() => useSessionStatistics());
    await waitFor(() => expect(result.current.snapshot.isLoaded).toBe(true));

    expect(result.current.snapshot.volumes.pinned).toBe(1);
    expect(result.current.snapshot.volumes.active).toBe(2);
    expect(result.current.snapshot.volumes.archived).toBe(3);
    expect(result.current.snapshot.volumes.total).toBe(6);
  });

  it('excludes archived sessions from heavy computations (totalTabs, totalGroups)', async () => {
    await fakeBrowser.storage.local.set({
      sessions: [
        makeSession({
          ungroupedTabs: [
            { id: 't1', title: 'A', url: 'https://a.com' },
            { id: 't2', title: 'B', url: 'https://b.com' },
          ],
          groups: [
            { id: 'g1', title: 'work', color: 'blue', tabs: [{ id: 't3', title: 'C', url: 'https://c.com' }] },
          ],
        }),
      ],
      archivedSessions: [
        makeSession({
          isArchived: true,
          ungroupedTabs: Array.from({ length: 50 }, (_, i) => ({
            id: `arch-${i}`, title: `T${i}`, url: `https://arch-${i}.com`,
          })),
          groups: [
            { id: 'g-arch', title: 'arch', color: 'red', tabs: [{ id: 'ta', title: 'X', url: 'https://x.com' }] },
          ],
        }),
      ],
    });

    const { result } = renderHook(() => useSessionStatistics());
    await waitFor(() => expect(result.current.snapshot.isLoaded).toBe(true));

    expect(result.current.snapshot.volumes.totalTabs).toBe(3);
    expect(result.current.snapshot.volumes.totalGroups).toBe(1);
    expect(result.current.snapshot.volumes.largest).toEqual({ name: 'Test session', tabCount: 3 });
  });

  it('computes percentages for notes and categories on active+pinned only', async () => {
    await fakeBrowser.storage.local.set({
      sessions: [
        makeSession({ note: 'hello', categoryId: 'development' }),
        makeSession({ note: '', categoryId: null }),
        makeSession({ note: '  ', categoryId: 'productivity' }),
        makeSession({ note: 'with note', categoryId: 'productivity' }),
      ],
      archivedSessions: [
        makeSession({ isArchived: true, note: 'should be ignored' }),
      ],
    });

    const { result } = renderHook(() => useSessionStatistics());
    await waitFor(() => expect(result.current.snapshot.isLoaded).toBe(true));

    expect(result.current.snapshot.volumes.percentWithNote).toBeCloseTo(50);
    expect(result.current.snapshot.volumes.percentWithCategory).toBeCloseTo(75);
  });
});

describe('useSessionStatistics — composition', () => {
  it('builds top categories and domains only from active+pinned sessions', async () => {
    await fakeBrowser.storage.local.set({
      sessions: [
        makeSession({
          categoryId: 'development',
          ungroupedTabs: [
            { id: 't1', title: 'GH', url: 'https://github.com/foo' },
            { id: 't2', title: 'GH2', url: 'https://github.com/bar' },
          ],
        }),
        makeSession({
          categoryId: 'development',
          ungroupedTabs: [
            { id: 't3', title: 'SO', url: 'https://stackoverflow.com/q/1' },
          ],
        }),
        makeSession({ categoryId: 'productivity' }),
      ],
      archivedSessions: [
        makeSession({
          isArchived: true,
          categoryId: 'media',
          ungroupedTabs: [
            { id: 'ta', title: 'X', url: 'https://media-archived.com' },
          ],
        }),
      ],
    });

    const { result } = renderHook(() => useSessionStatistics());
    await waitFor(() => expect(result.current.snapshot.isLoaded).toBe(true));

    const topCategories = result.current.snapshot.composition.topCategories;
    expect(topCategories[0]).toEqual({ id: 'development', count: 2 });
    expect(topCategories.some(c => c.id === 'media')).toBe(false);

    const topDomains = result.current.snapshot.composition.topDomains;
    expect(topDomains[0]).toEqual({ host: 'github.com', count: 2 });
    expect(topDomains.some(d => d.host === 'media-archived.com')).toBe(false);
  });

  it('aggregates group color distribution across all groups in active+pinned', async () => {
    await fakeBrowser.storage.local.set({
      sessions: [
        makeSession({
          groups: [
            { id: 'g1', title: 'a', color: 'blue', tabs: [] },
            { id: 'g2', title: 'b', color: 'blue', tabs: [] },
            { id: 'g3', title: 'c', color: 'red', tabs: [] },
          ],
        }),
      ],
    });

    const { result } = renderHook(() => useSessionStatistics());
    await waitFor(() => expect(result.current.snapshot.isLoaded).toBe(true));

    const dist = result.current.snapshot.composition.groupColorDistribution;
    expect(dist.find(d => d.color === 'blue')?.count).toBe(2);
    expect(dist.find(d => d.color === 'red')?.count).toBe(1);
  });

  it('handles malformed URLs gracefully', async () => {
    await fakeBrowser.storage.local.set({
      sessions: [
        makeSession({
          ungroupedTabs: [
            { id: 't1', title: 'broken', url: 'not a url' },
            { id: 't2', title: 'ok', url: 'https://valid.com' },
          ],
        }),
      ],
    });

    const { result } = renderHook(() => useSessionStatistics());
    await waitFor(() => expect(result.current.snapshot.isLoaded).toBe(true));

    const domains = result.current.snapshot.composition.topDomains;
    expect(domains).toEqual([{ host: 'valid.com', count: 1 }]);
  });
});

describe('useSessionStatistics — temporal', () => {
  it('picks oldest and most recent across all sessions including archived', async () => {
    await fakeBrowser.storage.local.set({
      sessions: [
        makeSession({ name: 'recent-active', createdAt: '2026-05-01T00:00:00Z', updatedAt: '2026-05-20T00:00:00Z' }),
      ],
      archivedSessions: [
        makeSession({ name: 'old-archived', isArchived: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-02-01T00:00:00Z' }),
        makeSession({ name: 'very-recent-archived', isArchived: true, createdAt: '2026-04-01T00:00:00Z', updatedAt: '2026-05-22T00:00:00Z' }),
      ],
    });

    const { result } = renderHook(() => useSessionStatistics());
    await waitFor(() => expect(result.current.snapshot.isLoaded).toBe(true));

    expect(result.current.snapshot.temporal.oldest?.name).toBe('old-archived');
    expect(result.current.snapshot.temporal.mostRecentlyUpdated?.name).toBe('very-recent-archived');
  });

  it('returns null oldest/recent when there are no sessions', async () => {
    const { result } = renderHook(() => useSessionStatistics());
    await waitFor(() => expect(result.current.snapshot.isLoaded).toBe(true));

    expect(result.current.snapshot.temporal.oldest).toBeNull();
    expect(result.current.snapshot.temporal.mostRecentlyUpdated).toBeNull();
  });
});
