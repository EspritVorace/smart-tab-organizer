import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  collectWorkspaceExport,
  applyWorkspaceImportAsNew,
  applyWorkspaceImportToExisting,
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
  await items.categoriesItem.setValue([]);
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
