import { describe, it, expect, beforeEach } from 'vitest';
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

function pressKey(target: HTMLElement, key: string): React.KeyboardEvent<HTMLElement> {
  // Build a minimal React-like keyboard event the hook can consume.
  let prevented = false;
  const event = {
    key,
    target,
    currentTarget: target,
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
