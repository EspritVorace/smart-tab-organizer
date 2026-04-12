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

    // g1 starts expanded
    expect(result.current.expandedGroups.has('g1')).toBe(true);

    act(() => result.current.toggleGroup('g1'));

    // g1 is now collapsed in local state
    expect(result.current.expandedGroups.has('g1')).toBe(false);

    // onSessionChange was called with collapsed: true
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

    // g1 starts collapsed
    expect(result.current.expandedGroups.has('g1')).toBe(false);

    act(() => result.current.toggleGroup('g1'));

    // g1 is now expanded in local state
    expect(result.current.expandedGroups.has('g1')).toBe(true);

    // onSessionChange was called with collapsed: false
    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedSession = onChange.mock.calls[0][0] as Session;
    expect(updatedSession.groups[0].collapsed).toBe(false);
  });
});
