import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
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

describe('useShortcuts (façade)', () => {
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
