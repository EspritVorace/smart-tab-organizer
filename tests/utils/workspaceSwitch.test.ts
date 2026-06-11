import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  computeRelativeTargetId,
  performWorkspaceSwitch,
  switchWorkspaceRelative,
} from '../../src/utils/workspaceSwitch';
import {
  activeWorkspaceIdItem,
  previousWorkspaceIdItem,
  workspacesIndexItem,
  _resetWorkspaceItemsCacheForTests,
} from '../../src/utils/workspaceStorage';
import type { WorkspaceMeta } from '../../src/schemas/workspace';

function ws(id: string): WorkspaceMeta {
  return { id, name: id.toUpperCase(), accentColor: 'indigo', createdAt: 'x', updatedAt: 'x' };
}

const A = ws('a');
const B = ws('b');
const C = ws('c');

beforeEach(() => {
  fakeBrowser.reset();
  _resetWorkspaceItemsCacheForTests();
});

describe('computeRelativeTargetId', () => {
  const list = [A, B, C];

  it('cycles to the next workspace', () => {
    expect(computeRelativeTargetId(list, 'a', null, 'next')).toBe('b');
    expect(computeRelativeTargetId(list, 'b', null, 'next')).toBe('c');
  });

  it('wraps around at the end going next', () => {
    expect(computeRelativeTargetId(list, 'c', null, 'next')).toBe('a');
  });

  it('cycles to the previous workspace and wraps around at the start', () => {
    expect(computeRelativeTargetId(list, 'b', null, 'prev')).toBe('a');
    expect(computeRelativeTargetId(list, 'a', null, 'prev')).toBe('c');
  });

  it('returns null for next/prev when a single workspace exists', () => {
    expect(computeRelativeTargetId([A], 'a', null, 'next')).toBeNull();
    expect(computeRelativeTargetId([A], 'a', null, 'prev')).toBeNull();
  });

  it('returns the previous pointer for last', () => {
    expect(computeRelativeTargetId(list, 'b', 'a', 'last')).toBe('a');
  });

  it('returns null for last when no valid previous pointer', () => {
    expect(computeRelativeTargetId(list, 'b', null, 'last')).toBeNull();
    expect(computeRelativeTargetId(list, 'b', 'b', 'last')).toBeNull();
    expect(computeRelativeTargetId(list, 'b', 'gone', 'last')).toBeNull();
  });
});

describe('performWorkspaceSwitch', () => {
  it('records the outgoing workspace as previous and stamps lastActivatedAt', async () => {
    await workspacesIndexItem.setValue([A, B, C]);
    await activeWorkspaceIdItem.setValue('a');

    await performWorkspaceSwitch('b');

    expect(await activeWorkspaceIdItem.getValue()).toBe('b');
    expect(await previousWorkspaceIdItem.getValue()).toBe('a');
    const index = await workspacesIndexItem.getValue();
    expect(index?.find((w) => w.id === 'b')?.lastActivatedAt).toBeDefined();
    expect(index?.find((w) => w.id === 'a')?.lastActivatedAt).toBeUndefined();
  });

  it('is a no-op when the target is already active', async () => {
    await workspacesIndexItem.setValue([A, B]);
    await activeWorkspaceIdItem.setValue('a');

    await performWorkspaceSwitch('a');

    expect(await activeWorkspaceIdItem.getValue()).toBe('a');
    expect(await previousWorkspaceIdItem.getValue()).toBeNull();
  });
});

describe('switchWorkspaceRelative', () => {
  beforeEach(async () => {
    await workspacesIndexItem.setValue([A, B, C]);
    await activeWorkspaceIdItem.setValue('a');
  });

  it('advances by one and reports the new active workspace', async () => {
    const outcome = await switchWorkspaceRelative('next');
    expect(outcome.switched).toBe(true);
    expect(outcome.activeId).toBe('b');
    expect(outcome.active?.id).toBe('b');
    expect(await activeWorkspaceIdItem.getValue()).toBe('b');
  });

  it('advances by two across two next calls (discrete sequence)', async () => {
    await switchWorkspaceRelative('next');
    const outcome = await switchWorkspaceRelative('next');
    expect(outcome.activeId).toBe('c');
  });

  it('toggles back and forth with last', async () => {
    // Start at a, switch to c so the previous pointer is a.
    await performWorkspaceSwitch('c');
    const back = await switchWorkspaceRelative('last');
    expect(back.activeId).toBe('a');
    const forth = await switchWorkspaceRelative('last');
    expect(forth.activeId).toBe('c');
  });

  it('does nothing and flags single when only one workspace exists', async () => {
    await workspacesIndexItem.setValue([A]);
    await activeWorkspaceIdItem.setValue('a');

    const outcome = await switchWorkspaceRelative('next');
    expect(outcome.switched).toBe(false);
    expect(outcome.reason).toBe('single');
    expect(outcome.activeId).toBe('a');
    expect(await activeWorkspaceIdItem.getValue()).toBe('a');
  });

  it('flags no-previous when last has no target', async () => {
    const outcome = await switchWorkspaceRelative('last');
    expect(outcome.switched).toBe(false);
    expect(outcome.reason).toBe('no-previous');
  });
});
