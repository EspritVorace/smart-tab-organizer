import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useShortcuts } from '../../src/hooks/useShortcuts';

function dispatch(combo: {
  key: string;
  alt?: boolean;
  shift?: boolean;
  ctrl?: boolean;
  meta?: boolean;
}): void {
  document.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: combo.key,
      altKey: combo.alt ?? false,
      shiftKey: combo.shift ?? false,
      ctrlKey: combo.ctrl ?? false,
      metaKey: combo.meta ?? false,
      bubbles: true,
      cancelable: true,
    }),
  );
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('useShortcuts (facade)', () => {
  it('resolves the registry id and fires the action when the combo is pressed', () => {
    const action = vi.fn();
    renderHook(() =>
      useShortcuts({ 'popup.save': action }, { scope: 'page:popup' }),
    );

    dispatch({ key: 's' });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('does not fire when the entry scope mismatches the requested scope', () => {
    const action = vi.fn();
    renderHook(() =>
      useShortcuts({ 'popup.save': action }, { scope: 'global' }),
    );

    dispatch({ key: 's' });
    expect(action).not.toHaveBeenCalled();
  });

  it('silently ignores unknown registry ids', () => {
    const action = vi.fn();
    expect(() =>
      renderHook(() =>
        useShortcuts({ 'does.not.exist': action }, { scope: 'page:popup' }),
      ),
    ).not.toThrow();

    dispatch({ key: 's' });
    expect(action).not.toHaveBeenCalled();
  });

  it('does not attach the listener when enabled is false', () => {
    const action = vi.fn();
    renderHook(() =>
      useShortcuts(
        { 'popup.save': action },
        { scope: 'page:popup', enabled: false },
      ),
    );

    dispatch({ key: 's' });
    expect(action).not.toHaveBeenCalled();
  });

  it('expands an entry with multiple defaultBindings into multiple ShortcutDefinitions', () => {
    const action = vi.fn();
    renderHook(() =>
      useShortcuts({ 'list.home.firstLast': action }, { scope: 'page:home' }),
    );

    dispatch({ key: 'Home' });
    dispatch({ key: 'End' });
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('defaults the scope to "global" when not provided', () => {
    const action = vi.fn();
    renderHook(() =>
      useShortcuts({ 'options.search.focus': action }),
    );

    dispatch({ key: '/' });
    expect(action).toHaveBeenCalledTimes(1);
  });
});

function dispatchOn(
  target: Element,
  combo: { key: string; alt?: boolean; shift?: boolean; ctrl?: boolean; meta?: boolean },
): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: combo.key,
      altKey: combo.alt ?? false,
      shiftKey: combo.shift ?? false,
      ctrlKey: combo.ctrl ?? false,
      metaKey: combo.meta ?? false,
      bubbles: true,
      cancelable: true,
    }),
  );
}

describe('useShortcuts (widget scope)', () => {
  it('does not fire a widget binding when focus is outside the matching scope', () => {
    const action = vi.fn();
    renderHook(() =>
      useShortcuts(
        { 'sessionCard.restore.custom': action },
        { scope: 'widget:session-card' },
      ),
    );

    dispatch({ key: 'r' });
    expect(action).not.toHaveBeenCalled();
  });

  it('fires a widget binding only when the scoped element itself has focus', () => {
    const action = vi.fn();
    renderHook(() =>
      useShortcuts(
        { 'sessionCard.restore.custom': action },
        { scope: 'widget:session-card' },
      ),
    );

    const card = document.createElement('div');
    card.setAttribute('data-shortcut-scope', 'widget:session-card');
    card.tabIndex = 0;
    document.body.appendChild(card);
    card.focus();

    dispatchOn(card, { key: 'r' });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('does not fire a widget binding when focus is on a descendant of the scoped element', () => {
    const action = vi.fn();
    renderHook(() =>
      useShortcuts(
        { 'ruleCard.toggleSelection': action },
        { scope: 'widget:rule-card' },
      ),
    );

    const card = document.createElement('div');
    card.setAttribute('data-shortcut-scope', 'widget:rule-card');
    card.tabIndex = 0;
    const handle = document.createElement('button');
    card.appendChild(handle);
    document.body.appendChild(card);
    handle.focus();

    // Space pressed on an inner control (e.g. drag handle) must not steal
    // the widget binding so the inner control's own handler can run.
    dispatchOn(handle, { key: ' ' });
    expect(action).not.toHaveBeenCalled();
  });

  it('lets a focused widget claim a combo away from a page-level binding flagged excludeIfInsideWidget', () => {
    const pageAction = vi.fn();
    const widgetAction = vi.fn();

    renderHook(() => {
      useShortcuts({ 'popup.restore': pageAction }, { scope: 'page:popup' });
      useShortcuts(
        { 'sessionCard.restore.custom': widgetAction },
        { scope: 'widget:session-card' },
      );
    });

    const card = document.createElement('div');
    card.setAttribute('data-shortcut-scope', 'widget:session-card');
    card.tabIndex = 0;
    document.body.appendChild(card);
    card.focus();

    dispatchOn(card, { key: 'r' });
    expect(pageAction).not.toHaveBeenCalled();
    expect(widgetAction).toHaveBeenCalledTimes(1);
  });

  it('still fires the page-level binding when focus is outside any widget scope', () => {
    const pageAction = vi.fn();
    renderHook(() =>
      useShortcuts({ 'popup.restore': pageAction }, { scope: 'page:popup' }),
    );

    dispatch({ key: 'r' });
    expect(pageAction).toHaveBeenCalledTimes(1);
  });

  it('does not block page-level shortcuts that omit excludeIfInsideWidget when focus is in a widget', () => {
    const action = vi.fn();
    renderHook(() =>
      useShortcuts({ 'popup.help': action }, { scope: 'page:popup' }),
    );

    const card = document.createElement('div');
    card.setAttribute('data-shortcut-scope', 'widget:session-card');
    card.tabIndex = 0;
    document.body.appendChild(card);
    card.focus();

    dispatchOn(card, { key: '?' });
    expect(action).toHaveBeenCalledTimes(1);
  });
});

describe('useShortcuts (sequences)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires the action when a sequence is typed within the timeout window', () => {
    const action = vi.fn();
    renderHook(() =>
      useShortcuts(
        { 'importexport.import.rules': action },
        { scope: 'page:importexport' },
      ),
    );

    dispatch({ key: 'i' });
    expect(action).not.toHaveBeenCalled();
    dispatch({ key: 'r' });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('does not fire when the second key arrives after the timeout', () => {
    const action = vi.fn();
    renderHook(() =>
      useShortcuts(
        { 'importexport.import.rules': action },
        { scope: 'page:importexport', sequenceTimeout: 1500 },
      ),
    );

    dispatch({ key: 'i' });
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    dispatch({ key: 'r' });
    expect(action).not.toHaveBeenCalled();
  });

  it('clears the buffer when an unrelated key is pressed mid-sequence', () => {
    const action = vi.fn();
    renderHook(() =>
      useShortcuts(
        { 'importexport.import.rules': action },
        { scope: 'page:importexport' },
      ),
    );

    dispatch({ key: 'i' });
    dispatch({ key: 'x' });
    dispatch({ key: 'r' });
    expect(action).not.toHaveBeenCalled();
  });

  it('clears the buffer when Escape is pressed', () => {
    const action = vi.fn();
    renderHook(() =>
      useShortcuts(
        { 'importexport.import.rules': action },
        { scope: 'page:importexport' },
      ),
    );

    dispatch({ key: 'i' });
    dispatch({ key: 'Escape' });
    dispatch({ key: 'r' });
    expect(action).not.toHaveBeenCalled();
  });

  it('clears the buffer on focusin into a typing target', () => {
    const action = vi.fn();
    renderHook(() =>
      useShortcuts(
        { 'importexport.import.rules': action },
        { scope: 'page:importexport' },
      ),
    );

    dispatch({ key: 'i' });
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    dispatch({ key: 'r' });
    expect(action).not.toHaveBeenCalled();
  });

  it('reports buffer state via onSequenceState (active then null)', () => {
    const action = vi.fn();
    const onSequenceState = vi.fn();
    renderHook(() =>
      useShortcuts(
        { 'importexport.import.rules': action },
        { scope: 'page:importexport', onSequenceState },
      ),
    );

    dispatch({ key: 'i' });
    expect(onSequenceState).toHaveBeenLastCalledWith({ activePrefix: ['i'] });

    dispatch({ key: 'r' });
    expect(action).toHaveBeenCalledTimes(1);
    expect(onSequenceState).toHaveBeenLastCalledWith({ activePrefix: null });
  });

  it('clears the indicator when the timeout expires', () => {
    const action = vi.fn();
    const onSequenceState = vi.fn();
    renderHook(() =>
      useShortcuts(
        { 'importexport.import.rules': action },
        { scope: 'page:importexport', sequenceTimeout: 500, onSequenceState },
      ),
    );

    dispatch({ key: 'i' });
    expect(onSequenceState).toHaveBeenLastCalledWith({ activePrefix: ['i'] });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(onSequenceState).toHaveBeenLastCalledWith({ activePrefix: null });
  });

  it('does not affect simple combos pressed before any sequence prefix', () => {
    const simpleAction = vi.fn();
    renderHook(() =>
      useShortcuts({ 'popup.save': simpleAction }, { scope: 'page:popup' }),
    );

    dispatch({ key: 's' });
    expect(simpleAction).toHaveBeenCalledTimes(1);
  });
});
