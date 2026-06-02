import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  collectWorkspaceExport,
  applyWorkspaceImportAsNew,
  applyWorkspaceImportToExisting,
  clearWorkspaceData,
} from '../../src/utils/workspaceImportExport';
import {
  DEFAULT_WORKSPACE_ID,
  defineWorkspaceItems,
  workspacesIndexItem,
  activeWorkspaceIdItem,
  _resetWorkspaceItemsCacheForTests,
} from '../../src/utils/workspaceStorage';
import { _resetWorkspaceContextForTests } from '../../src/utils/workspaceContext';
import type { WorkspaceMeta } from '../../src/schemas/workspace';
import type { ImportWorkspaceData } from '../../src/schemas/importExport';
import type { Session } from '../../src/types/session';

const defaultMeta: WorkspaceMeta = {
  id: DEFAULT_WORKSPACE_ID,
  name: 'Default',
  accentColor: 'indigo',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

beforeEach(() => {
  fakeBrowser.reset();
  _resetWorkspaceItemsCacheForTests();
  _resetWorkspaceContextForTests();
});

async function seedDefaultWorkspaceData(): Promise<void> {
  const items = defineWorkspaceItems(DEFAULT_WORKSPACE_ID);
  await items.globalGroupingEnabledItem.setValue(false);
  await items.globalDeduplicationEnabledItem.setValue(true);
  await items.deduplicateUnmatchedDomainsItem.setValue(true);
  await items.deduplicationKeepStrategyItem.setValue('keep-old');
  await items.notifyOnGroupingItem.setValue(false);
  await items.notifyOnDeduplicationItem.setValue(true);
  await items.domainRulesItem.setValue([
    {
      id: 'r1',
      domainFilter: 'example.com',
      label: 'Example',
      titleParsingRegEx: '',
      urlParsingRegEx: '',
      groupNameSource: 'title',
      deduplicationMatchMode: 'exact',
      color: 'blue',
      categoryId: null,
      deduplicationEnabled: true,
      ignoredQueryParams: [],
      presetId: null,
      urlExtractionMode: 'regex',
      enabled: true,
    },
  ]);
  await items.sessionsItem.setValue([]);
  await items.statisticsItem.setValue({
    tabGroupsCreatedCount: 12,
    tabsDeduplicatedCount: 7,
    dailyBuckets: { '2025-12-01': { r1: { grouping: 4, dedup: 1 } } },
    firstUsedAt: '2025-12-01T00:00:00.000Z',
  });
}

describe('collectWorkspaceExport', () => {
  it('packs settings, rules, categories and sessions; omits stats by default', async () => {
    await seedDefaultWorkspaceData();
    const payload = await collectWorkspaceExport(defaultMeta);
    expect(payload.workspace).toEqual({ name: 'Default', accentColor: 'indigo' });
    expect(payload.settings.globalGroupingEnabled).toBe(false);
    expect(payload.settings.deduplicationKeepStrategy).toBe('keep-old');
    expect(payload.domainRules).toHaveLength(1);
    expect(payload.statistics).toBeUndefined();
  });

  it('includes statistics when opted-in', async () => {
    await seedDefaultWorkspaceData();
    const payload = await collectWorkspaceExport(defaultMeta, { includeStatistics: true });
    expect(payload.statistics?.tabGroupsCreatedCount).toBe(12);
    expect(payload.statistics?.dailyBuckets['2025-12-01'].r1.grouping).toBe(4);
  });

  it('includes the trimmed note when provided', async () => {
    await seedDefaultWorkspaceData();
    const payload = await collectWorkspaceExport(defaultMeta, { note: '  hello  ' });
    expect(payload.note).toBe('hello');
  });
});

describe('applyWorkspaceImportAsNew', () => {
  function buildImport(name: string): ImportWorkspaceData {
    return {
      note: 'imported',
      workspace: { name, accentColor: 'jade' },
      settings: {
        globalGroupingEnabled: true,
        globalDeduplicationEnabled: true,
        deduplicateUnmatchedDomains: false,
        deduplicationKeepStrategy: 'keep-grouped-or-new',
        notifyOnGrouping: true,
        notifyOnDeduplication: true,
      },
      domainRules: [],
      categories: [],
      sessions: [],
    };
  }

  it('adds a new workspace, populates its scoped data and switches active', async () => {
    await workspacesIndexItem.setValue([defaultMeta]);
    await activeWorkspaceIdItem.setValue(DEFAULT_WORKSPACE_ID);

    const data = buildImport('Imported');
    const created = await applyWorkspaceImportAsNew(data);
    expect(created.name).toBe('Imported');
    expect(created.accentColor).toBe('jade');

    const index = (await workspacesIndexItem.getValue()) ?? [];
    expect(index).toHaveLength(2);
    expect((await activeWorkspaceIdItem.getValue())).toBe(created.id);

    const items = defineWorkspaceItems(created.id);
    expect(await items.globalGroupingEnabledItem.getValue()).toBe(true);
  });

  it('honors a name override', async () => {
    await workspacesIndexItem.setValue([defaultMeta]);
    const data = buildImport('Original');
    const created = await applyWorkspaceImportAsNew(data, { nameOverride: 'Renamed' });
    expect(created.name).toBe('Renamed');
  });
});

describe('applyWorkspaceImportToExisting', () => {
  it('replaces scoped data on the target workspace without touching its meta', async () => {
    await seedDefaultWorkspaceData();
    const data: ImportWorkspaceData = {
      workspace: { name: 'ignored', accentColor: 'jade' },
      settings: {
        globalGroupingEnabled: true,
        globalDeduplicationEnabled: false,
        deduplicateUnmatchedDomains: false,
        deduplicationKeepStrategy: 'keep-new',
        notifyOnGrouping: true,
        notifyOnDeduplication: true,
      },
      domainRules: [],
      categories: [],
      sessions: [],
    };

    await applyWorkspaceImportToExisting(DEFAULT_WORKSPACE_ID, data);

    const items = defineWorkspaceItems(DEFAULT_WORKSPACE_ID);
    expect(await items.globalGroupingEnabledItem.getValue()).toBe(true);
    expect(await items.globalDeduplicationEnabledItem.getValue()).toBe(false);
    expect(await items.deduplicationKeepStrategyItem.getValue()).toBe('keep-new');
    expect(await items.domainRulesItem.getValue()).toEqual([]);
  });

  it('only writes statistics when includeStatistics is true', async () => {
    await seedDefaultWorkspaceData();
    const data: ImportWorkspaceData = {
      workspace: { name: 'ignored', accentColor: 'jade' },
      settings: {
        globalGroupingEnabled: true,
        globalDeduplicationEnabled: true,
        deduplicateUnmatchedDomains: false,
        deduplicationKeepStrategy: 'keep-grouped-or-new',
        notifyOnGrouping: true,
        notifyOnDeduplication: true,
      },
      domainRules: [],
      categories: [],
      sessions: [],
      statistics: {
        tabGroupsCreatedCount: 99,
        tabsDeduplicatedCount: 11,
        dailyBuckets: {},
      },
    };

    await applyWorkspaceImportToExisting(DEFAULT_WORKSPACE_ID, data, { includeStatistics: false });
    const items = defineWorkspaceItems(DEFAULT_WORKSPACE_ID);
    const stats = await items.statisticsItem.getValue();
    expect(stats?.tabGroupsCreatedCount).toBe(12); // unchanged

    await applyWorkspaceImportToExisting(DEFAULT_WORKSPACE_ID, data, { includeStatistics: true });
    const updated = await items.statisticsItem.getValue();
    expect(updated?.tabGroupsCreatedCount).toBe(99);
  });
});

// ── Helpers for clearWorkspaceData / session partitioning ─────────────────────

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

function makePayload(overrides: Partial<ImportWorkspaceData> = {}): ImportWorkspaceData {
  return {
    workspace: { name: 'Test Workspace', accentColor: 'indigo' },
    settings: {
      globalGroupingEnabled: true,
      globalDeduplicationEnabled: false,
      deduplicateUnmatchedDomains: false,
      deduplicationKeepStrategy: 'keep-grouped-or-new',
      notifyOnGrouping: true,
      notifyOnDeduplication: true,
    },
    domainRules: [],
    categories: [],
    sessions: [],
    ...overrides,
  };
}

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
    const wsId = 'ws-part-archived';
    const archived = makeSession({ isArchived: true, isPinned: false });

    await applyWorkspaceImportToExisting(wsId, makePayload({ sessions: [archived] }));

    const result = await fakeBrowser.storage.local.get(`ws:${wsId}:archivedSessions`);
    expect(result[`ws:${wsId}:archivedSessions`]).toHaveLength(1);

    const active = await fakeBrowser.storage.local.get(`ws:${wsId}:sessions`);
    expect(active[`ws:${wsId}:sessions`]).toHaveLength(0);
  });

  it('places pinned non-archived sessions in the pinned bucket', async () => {
    const wsId = 'ws-part-pinned';
    const pinned = makeSession({ isPinned: true, isArchived: false });

    await applyWorkspaceImportToExisting(wsId, makePayload({ sessions: [pinned] }));

    const result = await fakeBrowser.storage.local.get(`ws:${wsId}:pinnedSessions`);
    expect(result[`ws:${wsId}:pinnedSessions`]).toHaveLength(1);
  });

  it('places regular sessions in the active bucket', async () => {
    const wsId = 'ws-part-active';
    const active = makeSession({ isPinned: false, isArchived: false });

    await applyWorkspaceImportToExisting(wsId, makePayload({ sessions: [active] }));

    const result = await fakeBrowser.storage.local.get(`ws:${wsId}:sessions`);
    expect(result[`ws:${wsId}:sessions`]).toHaveLength(1);
  });

  it('partitions a mixed list into the three buckets', async () => {
    const wsId = 'ws-part-mixed';
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
