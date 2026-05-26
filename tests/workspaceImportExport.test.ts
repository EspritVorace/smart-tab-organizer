import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  clearWorkspaceData,
  applyWorkspaceImportToExisting,
} from '../src/utils/workspaceImportExport';
import { DEFAULT_WORKSPACE_ID } from '../src/utils/workspaceStorage';
import type { ImportWorkspaceData } from '../src/schemas/importExport';
import type { Session } from '../src/types/session';

// ── Factories ─────────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<Session> = {}): Session {
  const now = new Date().toISOString();
  return {
    id: `sess-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test',
    createdAt: now,
    updatedAt: now,
    groups: [],
    ungroupedTabs: [{ id: 'tab-1', title: 'Page', url: 'https://example.com' }],
    isPinned: false,
    categoryId: null,
    ...overrides,
  };
}

const baseSettings: ImportWorkspaceData['settings'] = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: false,
  deduplicateUnmatchedDomains: false,
  deduplicationKeepStrategy: 'keep-grouped-or-new',
  notifyOnGrouping: true,
  notifyOnDeduplication: true,
  notifyOnOrganize: true,
};

function makePayload(overrides: Partial<ImportWorkspaceData> = {}): ImportWorkspaceData {
  return {
    workspace: { name: 'Test Workspace', accentColor: 'indigo' },
    settings: baseSettings,
    domainRules: [],
    categories: [],
    sessions: [],
    ...overrides,
  };
}

beforeEach(() => {
  fakeBrowser.reset();
});

// ── clearWorkspaceData ────────────────────────────────────────────────────────

describe('clearWorkspaceData', () => {
  it('does not remove any storage keys for the default workspace', async () => {
    await fakeBrowser.storage.local.set({ sessions: [makeSession()] });

    await clearWorkspaceData(DEFAULT_WORKSPACE_ID);

    const data = await fakeBrowser.storage.local.get('sessions');
    expect(data).toHaveProperty('sessions');
  });

  it('removes all scoped storage keys for a non-default workspace', async () => {
    const wsId = 'ws-test-clear';
    const scopedKey = `ws:${wsId}:sessions`;
    await fakeBrowser.storage.local.set({ [scopedKey]: [makeSession()] });

    await clearWorkspaceData(wsId);

    const data = await fakeBrowser.storage.local.get(scopedKey);
    expect(data).toEqual({});
  });
});

// ── applyWorkspaceImportToExisting — session partitioning ─────────────────────

describe('applyWorkspaceImportToExisting — session partitioning', () => {
  it('places archived sessions in the archived bucket', async () => {
    const wsId = 'ws-part-1';
    const archived = makeSession({ isArchived: true, isPinned: false });

    await applyWorkspaceImportToExisting(wsId, makePayload({ sessions: [archived] }));

    const result = await fakeBrowser.storage.local.get(`ws:${wsId}:archivedSessions`);
    expect(result[`ws:${wsId}:archivedSessions`]).toHaveLength(1);

    const active = await fakeBrowser.storage.local.get(`ws:${wsId}:sessions`);
    expect(active[`ws:${wsId}:sessions`]).toHaveLength(0);
  });

  it('places pinned non-archived sessions in the pinned bucket', async () => {
    const wsId = 'ws-part-2';
    const pinned = makeSession({ isPinned: true, isArchived: false });

    await applyWorkspaceImportToExisting(wsId, makePayload({ sessions: [pinned] }));

    const result = await fakeBrowser.storage.local.get(`ws:${wsId}:pinnedSessions`);
    expect(result[`ws:${wsId}:pinnedSessions`]).toHaveLength(1);
  });

  it('places regular sessions in the active bucket', async () => {
    const wsId = 'ws-part-3';
    const active = makeSession({ isPinned: false, isArchived: false });

    await applyWorkspaceImportToExisting(wsId, makePayload({ sessions: [active] }));

    const result = await fakeBrowser.storage.local.get(`ws:${wsId}:sessions`);
    expect(result[`ws:${wsId}:sessions`]).toHaveLength(1);
  });

  it('partitions a mixed list into the three buckets', async () => {
    const wsId = 'ws-part-4';
    const sessions = [
      makeSession({ isArchived: true }),
      makeSession({ isPinned: true }),
      makeSession(),
    ];

    await applyWorkspaceImportToExisting(wsId, makePayload({ sessions }));

    const archived = await fakeBrowser.storage.local.get(`ws:${wsId}:archivedSessions`);
    const pinned = await fakeBrowser.storage.local.get(`ws:${wsId}:pinnedSessions`);
    const active = await fakeBrowser.storage.local.get(`ws:${wsId}:sessions`);

    expect(archived[`ws:${wsId}:archivedSessions`]).toHaveLength(1);
    expect(pinned[`ws:${wsId}:pinnedSessions`]).toHaveLength(1);
    expect(active[`ws:${wsId}:sessions`]).toHaveLength(1);
  });
});
