import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../../src/hooks/useKeyboardShortcuts';
import type { ShortcutDefinition } from '../../src/utils/keyboardShortcuts';

function dispatch(combo: { key: string; alt?: boolean; shift?: boolean; ctrl?: boolean; meta?: boolean }): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: combo.key,
    altKey: combo.alt ?? false,
    shiftKey: combo.shift ?? false,
    ctrlKey: combo.ctrl ?? false,
    metaKey: combo.meta ?? false,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('useKeyboardShortcuts', () => {
  it('fires the action whose combo matches the keydown', () => {
    const action = vi.fn();
    const shortcuts: ShortcutDefinition[] = [{ combo: 'Alt+Shift+r', action }];
    renderHook(() => useKeyboardShortcuts(shortcuts));

    dispatch({ key: 'r', alt: true, shift: true });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('preventDefaults the matched event', () => {
    const action = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ combo: 'Escape', action }]));

    const event = dispatch({ key: 'Escape' });
    expect(action).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('only fires the first matching shortcut', () => {
    const a = vi.fn();
    const b = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([
        { combo: 'a', action: a },
        { combo: 'a', action: b },
      ]),
    );

    dispatch({ key: 'a' });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
  });

  it('does nothing when no shortcut matches', () => {
    const action = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ combo: 'Alt+r', action }]));

    dispatch({ key: 'r' });
    expect(action).not.toHaveBeenCalled();
  });

  it('does not attach the listener when enabled is false', () => {
    const action = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ combo: 'a', action }], { enabled: false }));

    dispatch({ key: 'a' });
    expect(action).not.toHaveBeenCalled();
  });

  it('removes the listener on unmount', () => {
    const action = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcuts([{ combo: 'a', action }]));

    dispatch({ key: 'a' });
    expect(action).toHaveBeenCalledTimes(1);

    unmount();
    dispatch({ key: 'a' });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('skips typing targets unless allowInTypingTarget is true', () => {
    const skipAction = vi.fn();
    const allowAction = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([
        { combo: 'a', action: skipAction },
        { combo: 'b', action: allowAction, allowInTypingTarget: true },
      ]),
    );

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const evtA = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
    input.dispatchEvent(evtA);
    const evtB = new KeyboardEvent('keydown', { key: 'b', bubbles: true, cancelable: true });
    input.dispatchEvent(evtB);

    expect(skipAction).not.toHaveBeenCalled();
    expect(allowAction).toHaveBeenCalledTimes(1);
  });

  it('skips when a Radix dialog is open unless allowWhenDialogOpen is true', () => {
    const skip = vi.fn();
    const allow = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([
        { combo: 'a', action: skip },
        { combo: 'b', action: allow, allowWhenDialogOpen: true },
      ]),
    );

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('data-state', 'open');
    document.body.appendChild(dialog);

    dispatch({ key: 'a' });
    dispatch({ key: 'b' });

    expect(skip).not.toHaveBeenCalled();
    expect(allow).toHaveBeenCalledTimes(1);
  });

  it('skips when target is within excludeIfTargetWithin selector', () => {
    const action = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([
        { combo: 'r', action, excludeIfTargetWithin: '.session-card' },
      ]),
    );

    const card = document.createElement('div');
    card.className = 'session-card';
    const inner = document.createElement('button');
    card.appendChild(inner);
    document.body.appendChild(card);

    const evt = new KeyboardEvent('keydown', { key: 'r', bubbles: true, cancelable: true });
    inner.dispatchEvent(evt);

    expect(action).not.toHaveBeenCalled();
  });
});
