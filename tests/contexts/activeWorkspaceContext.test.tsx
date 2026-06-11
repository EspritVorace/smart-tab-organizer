import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  ActiveWorkspaceProvider,
  useActiveWorkspaceContext,
} from '../../src/contexts/ActiveWorkspaceContext';
import {
  DEFAULT_WORKSPACE_ID,
  _resetWorkspaceItemsCacheForTests,
} from '../../src/utils/workspaceStorage';
import { migrateToWorkspaces } from '../../src/background/migration';

beforeEach(async () => {
  fakeBrowser.reset();
  _resetWorkspaceItemsCacheForTests();
  await migrateToWorkspaces();
});

const wrapper = ({ children }: { children: React.ReactNode }) =>
  <ActiveWorkspaceProvider>{children}</ActiveWorkspaceProvider>;

async function renderContext() {
  const view = renderHook(() => useActiveWorkspaceContext(), { wrapper });
  await waitFor(() => expect(view.result.current.isLoaded).toBe(true));
  return view;
}

describe('ActiveWorkspaceContext — initial state', () => {
  it('exposes the migrated default workspace as the active one', async () => {
    const { result } = await renderContext();
    expect(result.current.workspaces).toHaveLength(1);
    expect(result.current.activeId).toBe(DEFAULT_WORKSPACE_ID);
    expect(result.current.active?.accentColor).toBe('indigo');
  });
});

describe('ActiveWorkspaceContext — createWorkspace', () => {
  it('appends a new workspace and switches to it', async () => {
    const { result } = await renderContext();
    let createdId = '';
    await act(async () => {
      const created = await result.current.createWorkspace('Personal', 'jade');
      createdId = created.id;
    });
    await waitFor(() => expect(result.current.workspaces).toHaveLength(2));
    expect(result.current.activeId).toBe(createdId);
    expect(result.current.active?.name).toBe('Personal');
    expect(result.current.accentColor).toBe('jade');
  });
});

describe('ActiveWorkspaceContext — renameWorkspace', () => {
  it('updates the name in the index', async () => {
    const { result } = await renderContext();
    let createdId = '';
    await act(async () => {
      const created = await result.current.createWorkspace('Old', 'blue');
      createdId = created.id;
    });
    await waitFor(() => expect(result.current.workspaces).toHaveLength(2));
    await act(async () => {
      await result.current.renameWorkspace(createdId, 'New');
    });
    await waitFor(() =>
      expect(result.current.workspaces.find((w) => w.id === createdId)?.name).toBe('New'),
    );
  });

  it('ignores empty names', async () => {
    const { result } = await renderContext();
    let createdId = '';
    await act(async () => {
      const created = await result.current.createWorkspace('Keep', 'green');
      createdId = created.id;
    });
    await waitFor(() => expect(result.current.workspaces.find((w) => w.id === createdId)).toBeDefined());
    await act(async () => {
      await result.current.renameWorkspace(createdId, '   ');
    });
    expect(result.current.workspaces.find((w) => w.id === createdId)?.name).toBe('Keep');
  });
});

describe('ActiveWorkspaceContext — setWorkspaceColor', () => {
  it('updates the accentColor in the index', async () => {
    const { result } = await renderContext();
    let createdId = '';
    await act(async () => {
      const created = await result.current.createWorkspace('Colorful', 'red');
      createdId = created.id;
    });
    await waitFor(() => expect(result.current.workspaces).toHaveLength(2));
    await act(async () => {
      await result.current.setWorkspaceColor(createdId, 'cyan');
    });
    await waitFor(() =>
      expect(result.current.workspaces.find((w) => w.id === createdId)?.accentColor).toBe('cyan'),
    );
  });
});

describe('ActiveWorkspaceContext — switchTo', () => {
  it('stamps lastActivatedAt on the target workspace and leaves others untouched', async () => {
    const { result } = await renderContext();
    let createdId = '';
    await act(async () => {
      const created = await result.current.createWorkspace('Second', 'teal');
      createdId = created.id;
    });
    await waitFor(() => expect(result.current.workspaces).toHaveLength(2));
    // createWorkspace switches active but does not stamp lastActivatedAt.
    expect(result.current.workspaces.find((w) => w.id === createdId)?.lastActivatedAt).toBeUndefined();

    await act(async () => {
      await result.current.switchTo(DEFAULT_WORKSPACE_ID);
    });

    await waitFor(() => expect(result.current.activeId).toBe(DEFAULT_WORKSPACE_ID));
    expect(
      result.current.workspaces.find((w) => w.id === DEFAULT_WORKSPACE_ID)?.lastActivatedAt,
    ).toBeDefined();
    // The previously active workspace keeps no activation timestamp.
    expect(result.current.workspaces.find((w) => w.id === createdId)?.lastActivatedAt).toBeUndefined();
  });
});

describe('ActiveWorkspaceContext — removeWorkspace', () => {
  it('removes a non-default workspace and switches active to default when needed', async () => {
    const { result } = await renderContext();
    let createdId = '';
    await act(async () => {
      const created = await result.current.createWorkspace('Temp', 'orange');
      createdId = created.id;
    });
    await waitFor(() => expect(result.current.activeId).toBe(createdId));
    await act(async () => {
      await result.current.removeWorkspace(createdId);
    });
    await waitFor(() => expect(result.current.workspaces).toHaveLength(1));
    expect(result.current.activeId).toBe(DEFAULT_WORKSPACE_ID);
  });

  it('refuses to remove the default workspace', async () => {
    const { result } = await renderContext();
    await expect(
      result.current.removeWorkspace(DEFAULT_WORKSPACE_ID),
    ).rejects.toThrow();
    expect(result.current.workspaces).toHaveLength(1);
  });

  it('refuses to remove the only remaining workspace', async () => {
    const { result } = await renderContext();
    let createdId = '';
    await act(async () => {
      const created = await result.current.createWorkspace('Solo', 'plum');
      createdId = created.id;
    });
    await waitFor(() => expect(result.current.workspaces).toHaveLength(2));

    // Manually replace the index with a single non-default entry to exercise
    // the guard even when the default has been removed (ensures the error
    // path triggers regardless of which workspace is the last one).
    const { workspacesIndexItem } = await import('../../src/utils/workspaceStorage');
    await workspacesIndexItem.setValue([
      { id: createdId, name: 'Solo', accentColor: 'plum', createdAt: 'x', updatedAt: 'x' },
    ]);
    await waitFor(() => expect(result.current.workspaces).toHaveLength(1));

    await expect(
      result.current.removeWorkspace(createdId),
    ).rejects.toThrow();
  });

  it('clears the scoped storage keys for the removed workspace', async () => {
    const { result } = await renderContext();
    let createdId = '';
    await act(async () => {
      const created = await result.current.createWorkspace('ToWipe', 'pink');
      createdId = created.id;
    });
    // Write some scoped data
    const scopedKey = `ws:${createdId}:domainRules`;
    await fakeBrowser.storage.local.set({ [scopedKey]: [{ id: 'r1' }] });
    expect((await fakeBrowser.storage.local.get(scopedKey))[scopedKey]).toBeDefined();

    await act(async () => {
      await result.current.removeWorkspace(createdId);
    });
    await waitFor(() => expect(result.current.workspaces).toHaveLength(1));

    expect((await fakeBrowser.storage.local.get(scopedKey))[scopedKey]).toBeUndefined();
  });
});
