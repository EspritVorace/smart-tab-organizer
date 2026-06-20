import { describe, it, expect, vi } from 'vitest';
import type React from 'react';
import { makeEditKeyDownHandler } from '../../src/components/Core/TabTree/editRowUtils';

function keyEvent(key: string): React.KeyboardEvent {
  return { key } as React.KeyboardEvent;
}

describe('makeEditKeyDownHandler', () => {
  it('calls onSave on Enter and never onCancel', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    makeEditKeyDownHandler(onSave, onCancel)(keyEvent('Enter'));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel on Escape and never onSave', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    makeEditKeyDownHandler(onSave, onCancel)(keyEvent('Escape'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('ignores any other key', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const handler = makeEditKeyDownHandler(onSave, onCancel);
    for (const k of ['a', 'Tab', 'ArrowDown', 'Shift', ' ']) {
      handler(keyEvent(k));
    }
    expect(onSave).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('returns a reusable handler invoked once per call', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const handler = makeEditKeyDownHandler(onSave, onCancel);
    handler(keyEvent('Enter'));
    handler(keyEvent('Enter'));
    expect(onSave).toHaveBeenCalledTimes(2);
  });
});
