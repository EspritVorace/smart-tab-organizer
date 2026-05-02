import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { migrateToWorkspaces } from '../../src/background/migration';
import { DEFAULT_WORKSPACE_ID, _resetWorkspaceItemsCacheForTests } from '../../src/utils/workspaceStorage';
import { workspacesIndexSchema } from '../../src/schemas/workspace';

beforeEach(() => {
  fakeBrowser.reset();
  _resetWorkspaceItemsCacheForTests();
  vi.resetModules();
});

describe('migrateToWorkspaces — fresh install', () => {
  it('creates the default workspace entry and sets it as active', async () => {
    await migrateToWorkspaces();

    const { workspaces, activeWorkspaceId, workspacesMigrated } =
      await fakeBrowser.storage.local.get(['workspaces', 'activeWorkspaceId', 'workspacesMigrated']);

    expect(workspacesMigrated).toBe(true);
    expect(activeWorkspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(Array.isArray(workspaces)).toBe(true);
    expect(workspaces).toHaveLength(1);
    expect((workspaces as Array<{ id: string }>)[0].id).toBe(DEFAULT_WORKSPACE_ID);
  });

  it('produces an index that validates against workspacesIndexSchema', async () => {
    await migrateToWorkspaces();
    const { workspaces } = await fakeBrowser.storage.local.get('workspaces');
    const parsed = workspacesIndexSchema.safeParse(workspaces);
    expect(parsed.success).toBe(true);
  });

  it('uses indigo as the default accent color', async () => {
    await migrateToWorkspaces();
    const { workspaces } = await fakeBrowser.storage.local.get('workspaces');
    expect((workspaces as Array<{ accentColor: string }>)[0].accentColor).toBe('indigo');
  });
});

describe('migrateToWorkspaces — upgrade with existing data', () => {
  it('preserves legacy domainRules and statistics in place (no data move needed)', async () => {
    const legacyRules = [
      { id: 'r1', label: 'Existing', domainFilter: 'example.com', enabled: true, color: 'blue' },
    ];
    const legacyStats = { tabGroupsCreatedCount: 42, tabsDeduplicatedCount: 7, dailyBuckets: {} };
    await fakeBrowser.storage.local.set({
      domainRules: legacyRules,
      statistics: legacyStats,
    });

    await migrateToWorkspaces();

    const after = await fakeBrowser.storage.local.get(['domainRules', 'statistics']);
    expect(after.domainRules).toEqual(legacyRules);
    expect(after.statistics).toEqual(legacyStats);
  });
});

describe('migrateToWorkspaces — idempotence', () => {
  it('does nothing on a second invocation when the flag is set', async () => {
    await migrateToWorkspaces();
    const firstIndex = (await fakeBrowser.storage.local.get('workspaces')).workspaces;

    await migrateToWorkspaces();
    const secondIndex = (await fakeBrowser.storage.local.get('workspaces')).workspaces;

    expect(secondIndex).toEqual(firstIndex);
  });

  it('does not overwrite an existing user-curated index', async () => {
    const customIndex = [
      { id: DEFAULT_WORKSPACE_ID, name: 'Renamed', accentColor: 'jade' as const, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-06-01T00:00:00.000Z' },
    ];
    await fakeBrowser.storage.local.set({
      workspaces: customIndex,
      activeWorkspaceId: DEFAULT_WORKSPACE_ID,
    });

    await migrateToWorkspaces();

    const { workspaces } = await fakeBrowser.storage.local.get('workspaces');
    expect(workspaces).toEqual(customIndex);
  });

  it('respects an already-set activeWorkspaceId', async () => {
    await fakeBrowser.storage.local.set({
      workspaces: [
        { id: 'ws-a', name: 'A', accentColor: 'green', createdAt: 'x', updatedAt: 'x' },
      ],
      activeWorkspaceId: 'ws-a',
    });

    await migrateToWorkspaces();

    const { activeWorkspaceId } = await fakeBrowser.storage.local.get('activeWorkspaceId');
    expect(activeWorkspaceId).toBe('ws-a');
  });
});
