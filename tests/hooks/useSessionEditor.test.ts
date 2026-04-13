import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionEditor } from '../../src/hooks/useSessionEditor';
import type { Session, SavedTab, SavedTabGroup } from '../../src/types/session';

function tab(id: string, url = `https://${id}.com`): SavedTab {
  return { id, title: id, url };
}

function group(
  id: string,
  tabs: SavedTab[],
  color: 'blue' | 'red' | 'green' = 'blue',
): SavedTabGroup {
  return { id, title: id, color, tabs };
}

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: overrides.id ?? 'session-1',
    name: overrides.name ?? 'Original',
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00.000Z',
    groups: overrides.groups ?? [],
    ungroupedTabs: overrides.ungroupedTabs ?? [],
    isPinned: overrides.isPinned ?? false,
    categoryId: overrides.categoryId ?? null,
    note: overrides.note,
  };
}

describe('useSessionEditor — initial state', () => {
  it('initializes the working copy to a structural clone of the input', () => {
    const initial = makeSession({
      ungroupedTabs: [tab('a'), tab('b')],
      groups: [group('g1', [tab('c')])],
    });

    const { result } = renderHook(() => useSessionEditor(initial));

    expect(result.current.editedSession).toEqual(initial);
    // Structural clone — mutating the working copy must not touch the original.
    expect(result.current.editedSession).not.toBe(initial);
  });

  it('is not dirty initially', () => {
    const initial = makeSession({ ungroupedTabs: [tab('a')] });
    const { result } = renderHook(() => useSessionEditor(initial));
    expect(result.current.isDirty).toBe(false);
  });
});

describe('useSessionEditor — updateSessionName / updateSessionNote', () => {
  it('updateSessionName changes the name and marks dirty', () => {
    const initial = makeSession({ name: 'Before' });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.updateSessionName('After'));

    expect(result.current.editedSession.name).toBe('After');
    expect(result.current.isDirty).toBe(true);
  });

  it('updateSessionNote stores the note text', () => {
    const { result } = renderHook(() => useSessionEditor(makeSession()));

    act(() => result.current.updateSessionNote('Important context'));

    expect(result.current.editedSession.note).toBe('Important context');
    expect(result.current.isDirty).toBe(true);
  });

  it('updateSessionNote normalizes an empty string to undefined', () => {
    const { result } = renderHook(() =>
      useSessionEditor(makeSession({ note: 'Some note' })),
    );

    act(() => result.current.updateSessionNote(''));

    expect(result.current.editedSession.note).toBeUndefined();
  });
});

describe('useSessionEditor — applySessionUpdate', () => {
  it('replaces the working copy with the provided session', () => {
    const { result } = renderHook(() => useSessionEditor(makeSession()));
    const newSession = makeSession({ name: 'Replaced', isPinned: true });

    act(() => result.current.applySessionUpdate(newSession));

    expect(result.current.editedSession).toEqual(newSession);
    expect(result.current.isDirty).toBe(true);
  });
});

describe('useSessionEditor — removeTab', () => {
  it('removes an ungrouped tab by id', () => {
    const initial = makeSession({ ungroupedTabs: [tab('a'), tab('b')] });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.removeTab('a'));

    expect(result.current.editedSession.ungroupedTabs.map(t => t.id)).toEqual(['b']);
  });

  it('removes a tab nested inside a group', () => {
    const initial = makeSession({
      groups: [group('g1', [tab('a'), tab('b')])],
    });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.removeTab('a'));

    expect(result.current.editedSession.groups[0].tabs.map(t => t.id)).toEqual(['b']);
  });

  it('is a true no-op for an unknown tab id (isDirty stays false)', () => {
    const initial = makeSession({ ungroupedTabs: [tab('a')] });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.removeTab('unknown'));

    expect(result.current.editedSession).toEqual(initial);
    expect(result.current.isDirty).toBe(false);
  });
});

describe('useSessionEditor — updateTabUrl', () => {
  it('updates the URL of an ungrouped tab', () => {
    const initial = makeSession({ ungroupedTabs: [tab('a', 'https://old.com')] });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.updateTabUrl('a', 'https://new.com'));

    expect(result.current.editedSession.ungroupedTabs[0].url).toBe('https://new.com');
  });

  it('updates the URL of a tab inside a group', () => {
    const initial = makeSession({
      groups: [group('g1', [tab('a', 'https://old.com')])],
    });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.updateTabUrl('a', 'https://new.com'));

    expect(result.current.editedSession.groups[0].tabs[0].url).toBe('https://new.com');
  });
});

describe('useSessionEditor — moveTab', () => {
  it('moves an ungrouped tab up', () => {
    const initial = makeSession({
      ungroupedTabs: [tab('a'), tab('b'), tab('c')],
    });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.moveTab('b', 'up'));

    expect(result.current.editedSession.ungroupedTabs.map(t => t.id)).toEqual([
      'b',
      'a',
      'c',
    ]);
  });

  it('moves an ungrouped tab down', () => {
    const initial = makeSession({
      ungroupedTabs: [tab('a'), tab('b'), tab('c')],
    });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.moveTab('b', 'down'));

    expect(result.current.editedSession.ungroupedTabs.map(t => t.id)).toEqual([
      'a',
      'c',
      'b',
    ]);
  });

  it('does not move the first tab up (no-op)', () => {
    const initial = makeSession({ ungroupedTabs: [tab('a'), tab('b')] });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.moveTab('a', 'up'));

    expect(result.current.editedSession.ungroupedTabs.map(t => t.id)).toEqual(['a', 'b']);
    expect(result.current.isDirty).toBe(false);
  });

  it('does not move the last tab down (no-op)', () => {
    const initial = makeSession({ ungroupedTabs: [tab('a'), tab('b')] });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.moveTab('b', 'down'));

    expect(result.current.editedSession.ungroupedTabs.map(t => t.id)).toEqual(['a', 'b']);
    expect(result.current.isDirty).toBe(false);
  });

  it('moves a tab within its group', () => {
    const initial = makeSession({
      groups: [group('g1', [tab('a'), tab('b'), tab('c')])],
    });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.moveTab('c', 'up'));

    expect(result.current.editedSession.groups[0].tabs.map(t => t.id)).toEqual([
      'a',
      'c',
      'b',
    ]);
  });
});

describe('useSessionEditor — moveTabToGroup', () => {
  it('moves an ungrouped tab into a target group', () => {
    const initial = makeSession({
      ungroupedTabs: [tab('a')],
      groups: [group('g1', [tab('b')])],
    });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.moveTabToGroup('a', 'g1'));

    expect(result.current.editedSession.ungroupedTabs).toHaveLength(0);
    expect(result.current.editedSession.groups[0].tabs.map(t => t.id)).toEqual(['b', 'a']);
  });

  it('moves a grouped tab to the ungrouped area (targetGroupId=null)', () => {
    const initial = makeSession({
      groups: [group('g1', [tab('a'), tab('b')])],
    });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.moveTabToGroup('a', null));

    expect(result.current.editedSession.groups[0].tabs.map(t => t.id)).toEqual(['b']);
    expect(result.current.editedSession.ungroupedTabs.map(t => t.id)).toEqual(['a']);
  });

  it('moves a tab from one group to another', () => {
    const initial = makeSession({
      groups: [group('g1', [tab('a')]), group('g2', [tab('b')])],
    });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.moveTabToGroup('a', 'g2'));

    expect(result.current.editedSession.groups[0].tabs).toHaveLength(0);
    expect(result.current.editedSession.groups[1].tabs.map(t => t.id)).toEqual(['b', 'a']);
  });

  it('is a no-op for an unknown tab id', () => {
    const initial = makeSession({ ungroupedTabs: [tab('a')] });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.moveTabToGroup('unknown', 'g1'));

    expect(result.current.editedSession).toEqual(initial);
    expect(result.current.isDirty).toBe(false);
  });
});

describe('useSessionEditor — removeGroup', () => {
  it('delete_tabs removes the group and drops its tabs', () => {
    const initial = makeSession({
      groups: [group('g1', [tab('a'), tab('b')])],
    });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.removeGroup('g1', 'delete_tabs'));

    expect(result.current.editedSession.groups).toHaveLength(0);
    expect(result.current.editedSession.ungroupedTabs).toHaveLength(0);
  });

  it('ungroup_tabs removes the group and keeps its tabs as ungrouped', () => {
    const initial = makeSession({
      ungroupedTabs: [tab('x')],
      groups: [group('g1', [tab('a'), tab('b')])],
    });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.removeGroup('g1', 'ungroup_tabs'));

    expect(result.current.editedSession.groups).toHaveLength(0);
    expect(result.current.editedSession.ungroupedTabs.map(t => t.id)).toEqual([
      'x',
      'a',
      'b',
    ]);
  });

  it('is a no-op for an unknown group id', () => {
    const initial = makeSession({ groups: [group('g1', [tab('a')])] });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.removeGroup('unknown', 'delete_tabs'));

    expect(result.current.editedSession).toEqual(initial);
    expect(result.current.isDirty).toBe(false);
  });
});

describe('useSessionEditor — updateGroup', () => {
  it('updates the group title', () => {
    const initial = makeSession({ groups: [group('g1', [tab('a')])] });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.updateGroup('g1', { title: 'Renamed' }));

    expect(result.current.editedSession.groups[0].title).toBe('Renamed');
  });

  it('updates the group color', () => {
    const initial = makeSession({ groups: [group('g1', [tab('a')], 'blue')] });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.updateGroup('g1', { color: 'red' }));

    expect(result.current.editedSession.groups[0].color).toBe('red');
  });

  it('updates both title and color in a single call', () => {
    const initial = makeSession({ groups: [group('g1', [tab('a')], 'blue')] });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.updateGroup('g1', { title: 'Renamed', color: 'green' }));

    expect(result.current.editedSession.groups[0].title).toBe('Renamed');
    expect(result.current.editedSession.groups[0].color).toBe('green');
  });
});

describe('useSessionEditor — moveGroup', () => {
  it('moves a group up', () => {
    const initial = makeSession({
      groups: [
        group('g1', [tab('a')]),
        group('g2', [tab('b')]),
        group('g3', [tab('c')]),
      ],
    });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.moveGroup('g2', 'up'));

    expect(result.current.editedSession.groups.map(g => g.id)).toEqual([
      'g2',
      'g1',
      'g3',
    ]);
  });

  it('moves a group down', () => {
    const initial = makeSession({
      groups: [
        group('g1', [tab('a')]),
        group('g2', [tab('b')]),
      ],
    });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.moveGroup('g1', 'down'));

    expect(result.current.editedSession.groups.map(g => g.id)).toEqual(['g2', 'g1']);
  });

  it('does not move the first group up (no-op)', () => {
    const initial = makeSession({
      groups: [group('g1', [tab('a')]), group('g2', [tab('b')])],
    });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.moveGroup('g1', 'up'));

    expect(result.current.editedSession.groups.map(g => g.id)).toEqual(['g1', 'g2']);
    expect(result.current.isDirty).toBe(false);
  });

  it('does not move the last group down (no-op)', () => {
    const initial = makeSession({
      groups: [group('g1', [tab('a')]), group('g2', [tab('b')])],
    });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.moveGroup('g2', 'down'));

    expect(result.current.editedSession.groups.map(g => g.id)).toEqual(['g1', 'g2']);
    expect(result.current.isDirty).toBe(false);
  });

  it('is a no-op for an unknown group id', () => {
    const initial = makeSession({ groups: [group('g1', [tab('a')])] });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => result.current.moveGroup('unknown', 'up'));

    expect(result.current.isDirty).toBe(false);
  });
});

describe('useSessionEditor — updatedAt is owned by the save path', () => {
  it('does not bump updatedAt when editing fields', () => {
    const initial = makeSession({
      updatedAt: '2020-01-01T00:00:00.000Z',
      ungroupedTabs: [tab('a')],
      groups: [group('g1', [tab('b')])],
    });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => {
      result.current.updateSessionName('Renamed');
      result.current.updateSessionNote('Some note');
      result.current.removeTab('a');
      result.current.updateGroup('g1', { title: 'Work' });
    });

    // The working copy's updatedAt must still equal the original — the save
    // path (SessionEditDialog / sessionStorage.updateSession) is the only
    // place allowed to stamp a new timestamp.
    expect(result.current.editedSession.updatedAt).toBe('2020-01-01T00:00:00.000Z');
  });
});

describe('useSessionEditor — reset', () => {
  it('discards all changes and restores the initial session', () => {
    const initial = makeSession({
      name: 'Original',
      ungroupedTabs: [tab('a')],
    });
    const { result } = renderHook(() => useSessionEditor(initial));

    act(() => {
      result.current.updateSessionName('Edited');
      result.current.removeTab('a');
    });

    expect(result.current.isDirty).toBe(true);

    act(() => result.current.reset());

    expect(result.current.editedSession).toEqual(initial);
    expect(result.current.isDirty).toBe(false);
  });
});
