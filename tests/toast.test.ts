import { describe, it, expect, vi } from 'vitest';
import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  subscribeToToasts,
  type ToastPayload,
} from '../src/utils/toast';

describe('toast emitter', () => {
  it('emits a success payload with the provided title and message', () => {
    const received: ToastPayload[] = [];
    const unsubscribe = subscribeToToasts((p) => received.push(p));

    const id = showSuccessToast('Done', 'All good');

    unsubscribe();
    expect(received).toHaveLength(1);
    expect(received[0].id).toBe(id);
    expect(received[0].variant).toBe('success');
    expect(received[0].title).toBe('Done');
    expect(received[0].message).toBe('All good');
  });

  it('emits error and info variants with the correct tag', () => {
    const received: ToastPayload[] = [];
    const unsubscribe = subscribeToToasts((p) => received.push(p));

    showErrorToast('Oops', 'Something failed');
    showInfoToast('FYI', 'Heads up');

    unsubscribe();
    expect(received.map((p) => p.variant)).toEqual(['error', 'info']);
  });

  it('returns an unsubscribe function that stops further delivery', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToToasts(listener);

    showSuccessToast('A', 'a');
    unsubscribe();
    showSuccessToast('B', 'b');

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('assigns unique ids even for toasts emitted within the same tick', () => {
    const received: ToastPayload[] = [];
    const unsubscribe = subscribeToToasts((p) => received.push(p));

    showSuccessToast('A', 'a');
    showSuccessToast('B', 'b');
    showSuccessToast('C', 'c');

    unsubscribe();
    const ids = received.map((p) => p.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('broadcasts to multiple subscribers in insertion order', () => {
    const calls: string[] = [];
    const unsub1 = subscribeToToasts(() => calls.push('l1'));
    const unsub2 = subscribeToToasts(() => calls.push('l2'));

    showSuccessToast('x', 'y');

    unsub1();
    unsub2();
    expect(calls).toEqual(['l1', 'l2']);
  });
});
