import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing';
import {
  ActiveWorkspaceContext,
  type ActiveWorkspaceContextValue,
} from '../../src/contexts/ActiveWorkspaceContext';
import {
  defineWorkspaceItems,
  DEFAULT_WORKSPACE_ID,
} from '../../src/utils/workspaceStorage';
import type { WorkspaceMeta } from '../../src/schemas/workspace';
import { useStorageUsage } from '../../src/hooks/useStorageUsage';

const encoder = new TextEncoder();
const entryBytes = (rawKey: string, value: unknown): number =>
  encoder.encode(rawKey).length + encoder.encode(JSON.stringify(value)).length;

function makeWrapper(
  workspaces: WorkspaceMeta[],
  activeId: string,
): React.FC<{ children: React.ReactNode }> {
  const value: ActiveWorkspaceContextValue = {
    workspaces,
    activeId,
    active: workspaces.find((w) => w.id === activeId) ?? null,
    accentColor: 'indigo',
    scopedItems: defineWorkspaceItems(activeId),
    isLoaded: true,
    switchTo: async () => undefined,
    createWorkspace: async () => workspaces[0],
    renameWorkspace: async () => undefined,
    setWorkspaceColor: async () => undefined,
    removeWorkspace: async () => undefined,
  };
  return ({ children }) => (
    <ActiveWorkspaceContext.Provider value={value}>
      {children}
    </ActiveWorkspaceContext.Provider>
  );
}

const DEFAULT_META: WorkspaceMeta = {
  id: DEFAULT_WORKSPACE_ID,
  name: 'Default',
  accentColor: 'indigo',
};
const WORK_META: WorkspaceMeta = {
  id: 'work',
  name: 'Work',
  accentColor: 'blue',
};

beforeEach(() => {
  fakeBrowser.reset();
});

describe('useStorageUsage', () => {
  it('starts from an empty, not-loaded snapshot', async () => {
    const wrapper = makeWrapper([DEFAULT_META], DEFAULT_WORKSPACE_ID);
    const { result } = renderHook(() => useStorageUsage(), { wrapper });
    // Synchronous first render, before the async recompute resolves.
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.categories).toEqual([]);
    expect(result.current.globalTotalBytes).toBe(0);
    // Let the pending recompute settle so the state update happens inside act().
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
  });

  it('measures the active workspace, sorts categories by size desc, and computes the quota percentage', async () => {
    const rules = [{ id: 'r1' }, { id: 'r2' }];
    const bigSessions = Array.from({ length: 5 }, (_, i) => ({ id: `s${i}`, payload: 'x'.repeat(40) }));
    await fakeBrowser.storage.local.set({
      domainRules: rules,
      sessions: bigSessions,
    });

    const wrapper = makeWrapper([DEFAULT_META], DEFAULT_WORKSPACE_ID);
    const { result } = renderHook(() => useStorageUsage(), { wrapper });

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    // Categories sorted by descending size: the big sessions blob outweighs rules.
    const nonEmpty = result.current.categories.filter((c) => c.bytes > 0).map((c) => c.id);
    expect(nonEmpty[0]).toBe('sessions-active');
    expect(nonEmpty).toContain('domain-rules');

    const expectedRules = entryBytes('domainRules', rules);
    const expectedSessions = entryBytes('sessions', bigSessions);
    expect(result.current.workspaceTotalBytes).toBe(expectedRules + expectedSessions);

    // Global total counts the raw keys present in storage.local.
    expect(result.current.globalTotalBytes).toBe(expectedRules + expectedSessions);

    expect(result.current.quotaBytes).toBeGreaterThan(0);
    expect(result.current.quotaPercent).toBeCloseTo(
      (result.current.globalTotalBytes / result.current.quotaBytes) * 100,
      6,
    );
  });

  it('splits per-workspace breakdowns and sorts them by total size desc', async () => {
    const defaultRules = [{ id: 'r1' }];
    const workRules = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    await fakeBrowser.storage.local.set({
      domainRules: defaultRules,
      'ws:work:domainRules': workRules,
    });

    const wrapper = makeWrapper([DEFAULT_META, WORK_META], DEFAULT_WORKSPACE_ID);
    const { result } = renderHook(() => useStorageUsage(), { wrapper });

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.workspaces).toHaveLength(2);
    // The "work" workspace stores more, so it sorts first.
    expect(result.current.workspaces[0].workspaceId).toBe('work');
    expect(result.current.workspaces[0].name).toBe('Work');
    expect(result.current.workspaces[0].accentColor).toBe('blue');
    expect(result.current.workspaces[1].workspaceId).toBe(DEFAULT_WORKSPACE_ID);
  });

  it('keeps empty active categories when the active workspace has no measured entry', async () => {
    // activeId is not part of the workspaces list, so no entry matches it.
    const wrapper = makeWrapper([DEFAULT_META], 'orphan');
    const { result } = renderHook(() => useStorageUsage(), { wrapper });

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.categories).toEqual([]);
    expect(result.current.workspaceTotalBytes).toBe(0);
  });

  it('recomputes when a watched storage item changes', async () => {
    await fakeBrowser.storage.local.set({ domainRules: [{ id: 'r1' }] });
    const wrapper = makeWrapper([DEFAULT_META], DEFAULT_WORKSPACE_ID);
    const { result } = renderHook(() => useStorageUsage(), { wrapper });

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    const before = result.current.workspaceTotalBytes;

    await act(async () => {
      await fakeBrowser.storage.local.set({
        domainRules: [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }],
      });
    });

    await waitFor(() => expect(result.current.workspaceTotalBytes).toBeGreaterThan(before));
  });

  it('swallows measurement errors and stays not-loaded', async () => {
    vi.spyOn(fakeBrowser.storage.local, 'get').mockRejectedValue(new Error('boom'));
    const wrapper = makeWrapper([DEFAULT_META], DEFAULT_WORKSPACE_ID);
    const { result } = renderHook(() => useStorageUsage(), { wrapper });

    // Give the rejected recompute a chance to settle.
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current.isLoaded).toBe(false);
    vi.restoreAllMocks();
  });
});
