import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRef, type ReactNode } from 'react';
import { render, renderHook } from '@testing-library/react';
import {
  useListNavigation,
  type UseListNavigationOptions,
} from '../../src/hooks/useListNavigation';

interface SetupResult {
  list: HTMLDivElement;
  items: HTMLButtonElement[];
  api: ReturnType<typeof useListNavigation>;
}

function setup(itemCount: number, options?: UseListNavigationOptions): SetupResult {
  const list = document.createElement('div');
  const items: HTMLButtonElement[] = [];
  for (let i = 0; i < itemCount; i++) {
    const btn = document.createElement('button');
    btn.setAttribute('data-item', '');
    btn.setAttribute('tabindex', i === 0 ? '0' : '-1');
    btn.textContent = `Item ${i}`;
    list.appendChild(btn);
    items.push(btn);
  }
  document.body.appendChild(list);

  const { result } = renderHook(() => {
    const ref = useRef<HTMLDivElement | null>(list);
    return useListNavigation(ref, '[data-item]', options);
  });

  return { list, items, api: result.current };
}

function pressKey(
  target: HTMLElement,
  key: string,
  modifiers: { altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {},
): React.KeyboardEvent<HTMLElement> {
  // Build a minimal React-like keyboard event the hook can consume.
  let prevented = false;
  const event = {
    key,
    target,
    currentTarget: target,
    altKey: modifiers.altKey ?? false,
    ctrlKey: modifiers.ctrlKey ?? false,
    metaKey: modifiers.metaKey ?? false,
    shiftKey: modifiers.shiftKey ?? false,
    preventDefault: () => { prevented = true; },
    get defaultPrevented() { return prevented; },
  } as unknown as React.KeyboardEvent<HTMLElement>;
  return event;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('useListNavigation', () => {
  it('moves focus down on ArrowDown when axis is vertical (default)', () => {
    const { items, api } = setup(3);
    items[0].focus();
    const consumed = api.handleNavigationKey(pressKey(items[0], 'ArrowDown'), 0);
    expect(consumed).toBe(true);
    expect(document.activeElement).toBe(items[1]);
  });

  it('moves focus up on ArrowUp when axis is vertical', () => {
    const { items, api } = setup(3);
    items[2].focus();
    api.handleNavigationKey(pressKey(items[2], 'ArrowUp'), 2);
    expect(document.activeElement).toBe(items[1]);
  });

  it('ignores modifier+arrow combos so reorder shortcuts fall through', () => {
    // Mod+ArrowUp/Down are registry shortcuts (e.g. reorder a card). Navigation
    // must not consume or preventDefault them, otherwise the document-level
    // dispatch skips the reorder action (event.defaultPrevented guard).
    for (const mods of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }]) {
      const { items, api } = setup(3);
      items[2].focus();
      const event = pressKey(items[2], 'ArrowUp', mods);
      const consumed = api.handleNavigationKey(event, 2);
      expect(consumed).toBe(false);
      expect(event.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(items[2]);
    }
  });

  it('does not consume horizontal arrows when axis is vertical', () => {
    const { items, api } = setup(3);
    items[0].focus();
    const consumed = api.handleNavigationKey(pressKey(items[0], 'ArrowRight'), 0);
    expect(consumed).toBe(false);
    expect(document.activeElement).toBe(items[0]);
  });

  it('moves on horizontal arrows when axis is horizontal', () => {
    const { items, api } = setup(3, { axis: 'horizontal' });
    items[0].focus();
    api.handleNavigationKey(pressKey(items[0], 'ArrowRight'), 0);
    expect(document.activeElement).toBe(items[1]);
    api.handleNavigationKey(pressKey(items[1], 'ArrowLeft'), 1);
    expect(document.activeElement).toBe(items[0]);
  });

  it('handles both axes when axis is "both"', () => {
    const { items, api } = setup(3, { axis: 'both' });
    items[0].focus();
    api.handleNavigationKey(pressKey(items[0], 'ArrowRight'), 0);
    expect(document.activeElement).toBe(items[1]);
    api.handleNavigationKey(pressKey(items[1], 'ArrowDown'), 1);
    expect(document.activeElement).toBe(items[2]);
  });

  it('clamps Home to the first and End to the last item', () => {
    const { items, api } = setup(4);
    items[2].focus();
    api.handleNavigationKey(pressKey(items[2], 'Home'), 2);
    expect(document.activeElement).toBe(items[0]);
    api.handleNavigationKey(pressKey(items[0], 'End'), 0);
    expect(document.activeElement).toBe(items[3]);
  });

  it('does not move past the boundaries', () => {
    const { items, api } = setup(2);
    items[0].focus();
    api.handleNavigationKey(pressKey(items[0], 'ArrowUp'), 0);
    expect(document.activeElement).toBe(items[0]);
    items[1].focus();
    api.handleNavigationKey(pressKey(items[1], 'ArrowDown'), 1);
    expect(document.activeElement).toBe(items[1]);
  });

  it('rewrites tabindex on focused item when rovingTabIndex is true', () => {
    const { items, api } = setup(3, { rovingTabIndex: true });
    items[0].focus();
    api.handleNavigationKey(pressKey(items[0], 'ArrowDown'), 0);
    expect(items[0].getAttribute('tabindex')).toBe('-1');
    expect(items[1].getAttribute('tabindex')).toBe('0');
    expect(items[2].getAttribute('tabindex')).toBe('-1');
  });

  it('returns false when no items match the selector', () => {
    const empty = document.createElement('div');
    document.body.appendChild(empty);
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(empty);
      return useListNavigation(ref, '[data-item]');
    });
    const fakeTarget = document.createElement('button');
    const consumed = result.current.handleNavigationKey(pressKey(fakeTarget, 'ArrowDown'), 0);
    expect(consumed).toBe(false);
  });

  // Sanity check: hook can be consumed inside a real component without throwing.
  it('integrates with React refs', () => {
    function Harness({ children }: { children: ReactNode }) {
      const ref = useRef<HTMLDivElement>(null);
      const { handleNavigationKey } = useListNavigation(ref, '[data-item]');
      return (
        <div ref={ref} data-testid="list" onKeyDown={(e) => handleNavigationKey(e, 0)}>
          {children}
        </div>
      );
    }
    const { getByTestId } = render(
      <Harness>
        <button data-item type="button">A</button>
        <button data-item type="button">B</button>
      </Harness>,
    );
    expect(getByTestId('list')).toBeDefined();
  });
});

describe('useListNavigation autoFocus', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  function makeList(itemCount: number): HTMLDivElement {
    const list = document.createElement('div');
    for (let i = 0; i < itemCount; i++) {
      const btn = document.createElement('button');
      btn.setAttribute('data-item', '');
      btn.setAttribute('tabindex', '0');
      btn.textContent = `Item ${i}`;
      list.appendChild(btn);
    }
    document.body.appendChild(list);
    return list;
  }

  it('focuses the first item on mount when ready (default true)', () => {
    const list = makeList(3);
    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(list);
      return useListNavigation(ref, '[data-item]', { autoFocus: {} });
    });
    expect(document.activeElement).toBe(list.querySelector('[data-item]'));
  });

  it('falls back to fallbackSelector when the list has no items', () => {
    const list = makeList(0);
    const fallback = document.createElement('button');
    fallback.setAttribute('data-testid', 'fallback-btn');
    document.body.appendChild(fallback);
    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(list);
      return useListNavigation(ref, '[data-item]', {
        autoFocus: { fallbackSelector: '[data-testid="fallback-btn"]' },
      });
    });
    expect(document.activeElement).toBe(fallback);
  });

  it('falls back when the list ref is null (list not rendered)', () => {
    const fallback = document.createElement('button');
    fallback.setAttribute('data-testid', 'fallback-btn');
    document.body.appendChild(fallback);
    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(null);
      return useListNavigation(ref, '[data-item]', {
        autoFocus: { fallbackSelector: '[data-testid="fallback-btn"]' },
      });
    });
    expect(document.activeElement).toBe(fallback);
  });

  it('does not focus while not ready, then focuses once ready flips', () => {
    const list = makeList(2);
    const { rerender } = renderHook(
      ({ ready }: { ready: boolean }) => {
        const ref = useRef<HTMLDivElement | null>(list);
        return useListNavigation(ref, '[data-item]', { autoFocus: { ready } });
      },
      { initialProps: { ready: false } },
    );
    expect(document.activeElement).not.toBe(list.querySelector('[data-item]'));
    rerender({ ready: true });
    expect(document.activeElement).toBe(list.querySelector('[data-item]'));
  });

  it('focuses only once across re-renders', () => {
    const list = makeList(2);
    const first = list.querySelector<HTMLButtonElement>('[data-item]')!;
    const { rerender } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(list);
      return useListNavigation(ref, '[data-item]', { autoFocus: {} });
    });
    expect(document.activeElement).toBe(first);
    // Move focus elsewhere, then re-render: the guard must not steal it back.
    const other = document.createElement('button');
    document.body.appendChild(other);
    other.focus();
    rerender();
    expect(document.activeElement).toBe(other);
  });

  it('focuses with preventScroll to avoid scroll jumps', () => {
    const list = makeList(1);
    const item = list.querySelector<HTMLButtonElement>('[data-item]')!;
    const focusSpy = vi.spyOn(item, 'focus');
    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(list);
      return useListNavigation(ref, '[data-item]', { autoFocus: {} });
    });
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('does not steal focus already inside the list', () => {
    const list = makeList(2);
    const items = list.querySelectorAll<HTMLButtonElement>('[data-item]');
    // Simulate the user/test having tabbed to the second item before the effect.
    items[1].focus();
    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(list);
      return useListNavigation(ref, '[data-item]', { autoFocus: {} });
    });
    expect(document.activeElement).toBe(items[1]);
  });

  it('still focuses when current focus is outside the list (e.g. sidebar)', () => {
    const list = makeList(2);
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(list);
      return useListNavigation(ref, '[data-item]', { autoFocus: {} });
    });
    expect(document.activeElement).toBe(list.querySelector('[data-item]'));
  });

  it('does nothing when autoFocus is not set', () => {
    const list = makeList(2);
    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(list);
      return useListNavigation(ref, '[data-item]');
    });
    expect(document.activeElement).toBe(document.body);
  });
});
