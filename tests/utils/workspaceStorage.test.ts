import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  DEFAULT_WORKSPACE_ID,
  WORKSPACE_SCOPED_KEYS,
  defineWorkspaceItems,
  workspaceStorageKey,
  workspacesIndexItem,
  activeWorkspaceIdItem,
  _resetWorkspaceItemsCacheForTests,
} from '../../src/utils/workspaceStorage';

beforeEach(() => {
  fakeBrowser.reset();
  _resetWorkspaceItemsCacheForTests();
});

describe('workspaceStorageKey', () => {
  it('returns unprefixed key for the default workspace (legacy compatibility)', () => {
    expect(workspaceStorageKey(DEFAULT_WORKSPACE_ID, 'domainRules')).toBe('local:domainRules');
    expect(workspaceStorageKey(DEFAULT_WORKSPACE_ID, 'statistics')).toBe('local:statistics');
  });

  it('returns prefixed key for non-default workspaces', () => {
    expect(workspaceStorageKey('ws-123', 'domainRules')).toBe('local:ws:ws-123:domainRules');
    expect(workspaceStorageKey('alpha', 'sessions')).toBe('local:ws:alpha:sessions');
  });

  it('handles every scoped field declared in WORKSPACE_SCOPED_KEYS', () => {
    for (const field of WORKSPACE_SCOPED_KEYS) {
      expect(workspaceStorageKey('ws-x', field)).toBe(`local:ws:ws-x:${field}`);
    }
  });
});

describe('defineWorkspaceItems', () => {
  it('memoizes items per workspace id', () => {
    const a = defineWorkspaceItems('ws-a');
    const b = defineWorkspaceItems('ws-a');
    expect(b).toBe(a);
  });

  it('returns distinct items for different workspace ids', () => {
    const a = defineWorkspaceItems('ws-a');
    const b = defineWorkspaceItems('ws-b');
    expect(a.domainRulesItem).not.toBe(b.domainRulesItem);
    expect(a.statisticsItem.key).not.toBe(b.statisticsItem.key);
  });

  it('default workspace items use legacy unprefixed keys', () => {
    const items = defineWorkspaceItems(DEFAULT_WORKSPACE_ID);
    expect(items.domainRulesItem.key).toBe('local:domainRules');
    expect(items.statisticsItem.key).toBe('local:statistics');
    expect(items.sessionsItem.key).toBe('local:sessions');
  });

  it('non-default workspace items use the ws prefix', () => {
    const items = defineWorkspaceItems('ws-other');
    expect(items.domainRulesItem.key).toBe('local:ws:ws-other:domainRules');
    expect(items.statisticsItem.key).toBe('local:ws:ws-other:statistics');
  });

  it('writes to one workspace are isolated from another', async () => {
    const a = defineWorkspaceItems('ws-a');
    const b = defineWorkspaceItems('ws-b');
    await a.globalGroupingEnabledItem.setValue(false);
    await b.globalGroupingEnabledItem.setValue(true);
    expect(await a.globalGroupingEnabledItem.getValue()).toBe(false);
    expect(await b.globalGroupingEnabledItem.getValue()).toBe(true);
  });
});

describe('workspacesIndexItem & activeWorkspaceIdItem', () => {
  it('default to empty index and DEFAULT_WORKSPACE_ID active', async () => {
    expect(await workspacesIndexItem.getValue()).toEqual([]);
    expect(await activeWorkspaceIdItem.getValue()).toBe(DEFAULT_WORKSPACE_ID);
  });

  it('persists changes to the index', async () => {
    const now = new Date().toISOString();
    await workspacesIndexItem.setValue([
      { id: 'default', name: 'Default', accentColor: 'indigo', createdAt: now, updatedAt: now },
    ]);
    const stored = await workspacesIndexItem.getValue();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('default');
  });
});
