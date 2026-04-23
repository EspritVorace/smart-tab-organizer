import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTabTreeEditor } from '../../src/components/Core/TabTree/useTabTreeEditor';
import type { Session, SavedTab, SavedTabGroup } from '../../src/types/session';

vi.mock('../../src/utils/i18n.js', () => ({
  getMessage: vi.fn((key: string) => key),
}));

function tab(id: string, url = `https://${id}.com`): SavedTab {
  return { id, title: id, url };
}

function group(
  id: string,
  tabs: SavedTab[],
  collapsed?: boolean,
): SavedTabGroup {
  return { id, title: id, color: 'blue', tabs, ...(collapsed !== undefined ? { collapsed } : {}) };
}

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    name: 'Test Session',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    groups: overrides.groups ?? [],
    ungroupedTabs: overrides.ungroupedTabs ?? [],
    isPinned: false,
    categoryId: null,
    ...overrides,
  };
}

describe('useTabTreeEditor — collapsed state initialization [US-S018]', () => {
  it('initializes a group with collapsed: true as collapsed (absent from expandedGroups)', () => {
    const session = makeSession({
      groups: [group('g1', [tab('a')], true)],
    });
    const onChange = vi.fn();

    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    expect(result.current.expandedGroups.has('g1')).toBe(false);
  });

  it('initializes a group with collapsed: false as expanded (present in expandedGroups)', () => {
    const session = makeSession({
      groups: [group('g1', [tab('a')], false)],
    });
    const onChange = vi.fn();

    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    expect(result.current.expandedGroups.has('g1')).toBe(true);
  });

  it('initializes a group without collapsed field as expanded (backward compat)', () => {
    const session = makeSession({
      groups: [group('g1', [tab('a')])],
    });
    const onChange = vi.fn();

    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    expect(result.current.expandedGroups.has('g1')).toBe(true);
  });

  it('handles mixed collapsed/expanded groups correctly', () => {
    const session = makeSession({
      groups: [
        group('expanded', [tab('a')], false),
        group('collapsed', [tab('b')], true),
        group('default', [tab('c')]),
      ],
    });
    const onChange = vi.fn();

    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    expect(result.current.expandedGroups.has('expanded')).toBe(true);
    expect(result.current.expandedGroups.has('collapsed')).toBe(false);
    expect(result.current.expandedGroups.has('default')).toBe(true);
  });
});

describe('useTabTreeEditor — toggleGroup persists collapsed state [US-S018]', () => {
  it('collapsing an expanded group calls onSessionChange with collapsed: true', () => {
    const session = makeSession({
      groups: [group('g1', [tab('a')], false)],
    });
    const onChange = vi.fn();

    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    expect(result.current.expandedGroups.has('g1')).toBe(true);
    act(() => result.current.toggleGroup('g1'));
    expect(result.current.expandedGroups.has('g1')).toBe(false);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedSession = onChange.mock.calls[0][0] as Session;
    expect(updatedSession.groups[0].collapsed).toBe(true);
  });

  it('expanding a collapsed group calls onSessionChange with collapsed: false', () => {
    const session = makeSession({
      groups: [group('g1', [tab('a')], true)],
    });
    const onChange = vi.fn();

    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    expect(result.current.expandedGroups.has('g1')).toBe(false);
    act(() => result.current.toggleGroup('g1'));
    expect(result.current.expandedGroups.has('g1')).toBe(true);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedSession = onChange.mock.calls[0][0] as Session;
    expect(updatedSession.groups[0].collapsed).toBe(false);
  });
});

describe('useTabTreeEditor — auto-expand new groups', () => {
  it('auto-expands a group added after initial render', () => {
    const session = makeSession({ groups: [] });
    const onChange = vi.fn();

    const { result, rerender } = renderHook(
      ({ s }: { s: Session }) => useTabTreeEditor(s, onChange),
      { initialProps: { s: session } },
    );

    expect(result.current.expandedGroups.size).toBe(0);

    const updated = makeSession({ groups: [group('g-new', [tab('a')])] });
    rerender({ s: updated });

    expect(result.current.expandedGroups.has('g-new')).toBe(true);
  });

  it('does not auto-expand a group that was already known at init', () => {
    const session = makeSession({ groups: [group('g1', [tab('a')], true)] });
    const onChange = vi.fn();

    const { result, rerender } = renderHook(
      ({ s }: { s: Session }) => useTabTreeEditor(s, onChange),
      { initialProps: { s: session } },
    );

    expect(result.current.expandedGroups.has('g1')).toBe(false);

    // Re-render with same groups — should not auto-expand
    rerender({ s: makeSession({ groups: [group('g1', [tab('a')], true)] }) });

    expect(result.current.expandedGroups.has('g1')).toBe(false);
  });
});

describe('useTabTreeEditor — tab and group editing', () => {
  it('openTabEdit sets editingItemId and editUrl', () => {
    const session = makeSession({ ungroupedTabs: [tab('t1', 'https://example.com')] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.openTabEdit(tab('t1', 'https://example.com')));

    expect(result.current.editingItemId).toBe('t1');
    expect(result.current.editUrl).toBe('https://example.com');
    expect(result.current.urlError).toBeNull();
  });

  it('openGroupEdit sets editingItemId, editGroupName and editGroupColor', () => {
    const g = group('g1', [tab('a')]);
    const session = makeSession({ groups: [g] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.openGroupEdit(g));

    expect(result.current.editingItemId).toBe('g1');
    expect(result.current.editGroupName).toBe('g1');
    expect(result.current.editGroupColor).toBe('blue');
  });

  it('cancelEdit clears editingItemId and urlError', () => {
    const session = makeSession({ ungroupedTabs: [tab('t1')] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.openTabEdit(tab('t1')));
    act(() => result.current.cancelEdit());

    expect(result.current.editingItemId).toBeNull();
    expect(result.current.urlError).toBeNull();
  });

  it('saveTabEdit updates a tab URL in ungroupedTabs', () => {
    const session = makeSession({ ungroupedTabs: [tab('t1', 'https://old.com')] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.openTabEdit(tab('t1', 'https://old.com')));
    act(() => result.current.setEditUrl('https://new.com'));
    act(() => result.current.saveTabEdit('t1'));

    expect(onChange).toHaveBeenCalledOnce();
    const updated = onChange.mock.calls[0][0] as Session;
    expect(updated.ungroupedTabs[0].url).toBe('https://new.com');
    expect(result.current.editingItemId).toBeNull();
  });

  it('saveTabEdit prepends https:// when protocol is missing', () => {
    const session = makeSession({ ungroupedTabs: [tab('t1', 'https://old.com')] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.openTabEdit(tab('t1', 'https://old.com')));
    act(() => result.current.setEditUrl('example.com'));
    act(() => result.current.saveTabEdit('t1'));

    const updated = onChange.mock.calls[0][0] as Session;
    expect(updated.ungroupedTabs[0].url).toBe('https://example.com');
  });

  it('saveTabEdit sets urlError on invalid URL', () => {
    const session = makeSession({ ungroupedTabs: [tab('t1')] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.openTabEdit(tab('t1')));
    act(() => result.current.setEditUrl('not a url !!!'));
    act(() => result.current.saveTabEdit('t1'));

    expect(onChange).not.toHaveBeenCalled();
    expect(result.current.urlError).toBe('tabEditorUrlInvalid');
  });

  it('saveTabEdit updates a tab URL inside a group', () => {
    const session = makeSession({ groups: [group('g1', [tab('t1', 'https://old.com')])] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.openTabEdit(tab('t1', 'https://old.com')));
    act(() => result.current.setEditUrl('https://new.com'));
    act(() => result.current.saveTabEdit('t1'));

    const updated = onChange.mock.calls[0][0] as Session;
    expect(updated.groups[0].tabs[0].url).toBe('https://new.com');
  });

  it('saveGroupEdit updates group title and color', () => {
    const session = makeSession({ groups: [group('g1', [tab('a')])] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.openGroupEdit(group('g1', [tab('a')])));
    act(() => {
      result.current.setEditGroupName('Renamed Group');
      result.current.setEditGroupColor('red');
    });
    act(() => result.current.saveGroupEdit('g1'));

    const updated = onChange.mock.calls[0][0] as Session;
    expect(updated.groups[0].title).toBe('Renamed Group');
    expect(updated.groups[0].color).toBe('red');
    expect(result.current.editingItemId).toBeNull();
  });
});

describe('useTabTreeEditor — moveTabInContext', () => {
  it('moves an ungrouped tab up', () => {
    const session = makeSession({ ungroupedTabs: [tab('a'), tab('b'), tab('c')] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.moveTabInContext('b', 'up', null));

    const updated = onChange.mock.calls[0][0] as Session;
    expect(updated.ungroupedTabs.map(t => t.id)).toEqual(['b', 'a', 'c']);
  });

  it('moves an ungrouped tab down', () => {
    const session = makeSession({ ungroupedTabs: [tab('a'), tab('b'), tab('c')] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.moveTabInContext('b', 'down', null));

    const updated = onChange.mock.calls[0][0] as Session;
    expect(updated.ungroupedTabs.map(t => t.id)).toEqual(['a', 'c', 'b']);
  });

  it('does nothing when moving the first ungrouped tab up', () => {
    const session = makeSession({ ungroupedTabs: [tab('a'), tab('b')] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.moveTabInContext('a', 'up', null));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('moves a tab within a group', () => {
    const session = makeSession({ groups: [group('g1', [tab('a'), tab('b'), tab('c')])] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.moveTabInContext('b', 'up', 'g1'));

    const updated = onChange.mock.calls[0][0] as Session;
    expect(updated.groups[0].tabs.map(t => t.id)).toEqual(['b', 'a', 'c']);
  });

  it('preserves tab order when moving the last grouped tab down', () => {
    const session = makeSession({ groups: [group('g1', [tab('a'), tab('b')])] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.moveTabInContext('b', 'down', 'g1'));

    // onSessionChange is called (updatedAt changes) but tab order is unchanged
    expect(onChange).toHaveBeenCalledOnce();
    const updated = onChange.mock.calls[0][0] as Session;
    expect(updated.groups[0].tabs.map(t => t.id)).toEqual(['a', 'b']);
  });
});

describe('useTabTreeEditor — moveGroupInList', () => {
  it('moves a group up', () => {
    const session = makeSession({ groups: [group('g1', [tab('a')]), group('g2', [tab('b')])] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.moveGroupInList('g2', 'up'));

    const updated = onChange.mock.calls[0][0] as Session;
    expect(updated.groups.map(g => g.id)).toEqual(['g2', 'g1']);
  });

  it('does nothing when moving the first group up', () => {
    const session = makeSession({ groups: [group('g1', [tab('a')]), group('g2', [tab('b')])] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.moveGroupInList('g1', 'up'));

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('useTabTreeEditor — moveTabToGroup', () => {
  it('moves a tab from ungrouped to a group', () => {
    const session = makeSession({
      ungroupedTabs: [tab('t1')],
      groups: [group('g1', [tab('t2')])],
    });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.moveTabToGroup('t1', null, 'g1'));

    const updated = onChange.mock.calls[0][0] as Session;
    expect(updated.ungroupedTabs).toHaveLength(0);
    expect(updated.groups[0].tabs.map(t => t.id)).toContain('t1');
  });

  it('moves a tab from a group to ungrouped', () => {
    const session = makeSession({
      ungroupedTabs: [],
      groups: [group('g1', [tab('t1'), tab('t2')])],
    });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.moveTabToGroup('t1', 'g1', null));

    const updated = onChange.mock.calls[0][0] as Session;
    expect(updated.ungroupedTabs.map(t => t.id)).toContain('t1');
    expect(updated.groups[0].tabs.map(t => t.id)).not.toContain('t1');
  });

  it('does nothing if tab is not found', () => {
    const session = makeSession({ ungroupedTabs: [], groups: [group('g1', [tab('t1')])] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.moveTabToGroup('nonexistent', 'g1', null));

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('useTabTreeEditor — handleDeleteTab and performDeleteTab', () => {
  it('deletes an ungrouped tab directly', () => {
    const session = makeSession({ ungroupedTabs: [tab('t1'), tab('t2')] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.handleDeleteTab('t1', null));

    const updated = onChange.mock.calls[0][0] as Session;
    expect(updated.ungroupedTabs.map(t => t.id)).toEqual(['t2']);
  });

  it('deletes a tab from a group with multiple tabs directly', () => {
    const session = makeSession({ groups: [group('g1', [tab('t1'), tab('t2')])] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.handleDeleteTab('t1', 'g1'));

    const updated = onChange.mock.calls[0][0] as Session;
    expect(updated.groups[0].tabs.map(t => t.id)).toEqual(['t2']);
  });

  it('shows alert dialog when deleting the last tab in a group', () => {
    const session = makeSession({ groups: [group('g1', [tab('t1')])] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.handleDeleteTab('t1', 'g1'));

    expect(onChange).not.toHaveBeenCalled();
    expect(result.current.alertDialog).toEqual({
      type: 'delete_last_tab',
      tabId: 't1',
      groupId: 'g1',
    });
  });

  it('performDeleteTab with deleteEmptyGroup=true removes the group', () => {
    const session = makeSession({ groups: [group('g1', [tab('t1')])] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.performDeleteTab('t1', 'g1', true));

    const updated = onChange.mock.calls[0][0] as Session;
    expect(updated.groups).toHaveLength(0);
    expect(result.current.alertDialog).toBeNull();
  });

  it('performDeleteTab with deleteEmptyGroup=false keeps the empty group', () => {
    const session = makeSession({ groups: [group('g1', [tab('t1')])] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.performDeleteTab('t1', 'g1', false));

    const updated = onChange.mock.calls[0][0] as Session;
    expect(updated.groups).toHaveLength(1);
    expect(updated.groups[0].tabs).toHaveLength(0);
  });
});

describe('useTabTreeEditor — handleDeleteGroup', () => {
  it('deletes group and its tabs with action delete_tabs', () => {
    const session = makeSession({
      ungroupedTabs: [tab('u1')],
      groups: [group('g1', [tab('t1'), tab('t2')])],
    });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.handleDeleteGroup('g1', 'delete_tabs'));

    const updated = onChange.mock.calls[0][0] as Session;
    expect(updated.groups).toHaveLength(0);
    expect(updated.ungroupedTabs.map(t => t.id)).toEqual(['u1']);
    expect(result.current.alertDialog).toBeNull();
  });

  it('ungroups tabs with action ungroup_tabs', () => {
    const session = makeSession({
      ungroupedTabs: [tab('u1')],
      groups: [group('g1', [tab('t1'), tab('t2')])],
    });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.handleDeleteGroup('g1', 'ungroup_tabs'));

    const updated = onChange.mock.calls[0][0] as Session;
    expect(updated.groups).toHaveLength(0);
    expect(updated.ungroupedTabs.map(t => t.id)).toEqual(['u1', 't1', 't2']);
  });

  it('does nothing if group is not found', () => {
    const session = makeSession({ groups: [group('g1', [tab('t1')])] });
    const onChange = vi.fn();
    const { result } = renderHook(() => useTabTreeEditor(session, onChange));

    act(() => result.current.handleDeleteGroup('nonexistent', 'delete_tabs'));

    expect(onChange).not.toHaveBeenCalled();
  });
});
