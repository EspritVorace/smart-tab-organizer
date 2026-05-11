import { describe, it, expect } from 'vitest';
import {
  serializeKeyEvent,
  matchesBinding,
  isSequencePrefix,
} from '../../src/utils/keyboardShortcuts';

function makeEvent(init: {
  key: string;
  alt?: boolean;
  shift?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  code?: string;
}): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key: init.key,
    altKey: init.alt ?? false,
    shiftKey: init.shift ?? false,
    ctrlKey: init.ctrl ?? false,
    metaKey: init.meta ?? false,
    code: init.code,
  });
}

describe('serializeKeyEvent', () => {
  it('returns the lowercase key for a plain letter', () => {
    expect(serializeKeyEvent(makeEvent({ key: 'r' }))).toBe('r');
    expect(serializeKeyEvent(makeEvent({ key: 'R' }))).toBe('r');
  });

  it('prepends modifiers in canonical order Meta+Ctrl+Alt+Shift', () => {
    expect(
      serializeKeyEvent(
        makeEvent({ key: 'k', meta: true, ctrl: true, alt: true, shift: true }),
      ),
    ).toBe('Meta+Ctrl+Alt+Shift+k');
  });

  it('returns null for lone modifier keys', () => {
    for (const key of ['Shift', 'Control', 'Alt', 'Meta', 'OS', 'ContextMenu']) {
      expect(serializeKeyEvent(makeEvent({ key }))).toBeNull();
    }
  });

  it('omits Shift for shift-insensitive keys (? and /)', () => {
    expect(serializeKeyEvent(makeEvent({ key: '?', shift: true }))).toBe('?');
    expect(serializeKeyEvent(makeEvent({ key: '/', shift: true }))).toBe('/');
  });

  it('keeps Shift for ordinary keys', () => {
    expect(serializeKeyEvent(makeEvent({ key: 'r', shift: true }))).toBe('Shift+r');
  });
});

describe('matchesBinding', () => {
  it('matches a simple combo when the buffer is length 1', () => {
    const event = makeEvent({ key: 'r' });
    expect(matchesBinding(['r'], 'r', event)).toBe(true);
  });

  it('rejects a simple combo when the buffer is longer than 1', () => {
    const event = makeEvent({ key: 'r' });
    expect(matchesBinding(['i', 'r'], 'r', event)).toBe(false);
  });

  it('matches a sequence when the buffer mirrors it exactly', () => {
    const event = makeEvent({ key: 'r' });
    expect(matchesBinding(['i', 'r'], ['i', 'r'], event)).toBe(true);
  });

  it('rejects a sequence when only partially typed', () => {
    const event = makeEvent({ key: 'i' });
    expect(matchesBinding(['i'], ['i', 'r'], event)).toBe(false);
  });

  it('rejects a sequence when the last step does not match the live event', () => {
    const event = makeEvent({ key: 'x' });
    expect(matchesBinding(['i', 'x'], ['i', 'r'], event)).toBe(false);
  });
});

describe('isSequencePrefix', () => {
  it('returns false for simple combo bindings', () => {
    const event = makeEvent({ key: 'r' });
    expect(isSequencePrefix(['r'], 'r', event)).toBe(false);
  });

  it('returns true when the buffer is a strict prefix of the sequence', () => {
    const event = makeEvent({ key: 'i' });
    expect(isSequencePrefix(['i'], ['i', 'r'], event)).toBe(true);
  });

  it('returns false when the buffer fully matches the sequence', () => {
    const event = makeEvent({ key: 'r' });
    expect(isSequencePrefix(['i', 'r'], ['i', 'r'], event)).toBe(false);
  });

  it('returns false when the buffer step diverges from the sequence', () => {
    const event = makeEvent({ key: 'x' });
    expect(isSequencePrefix(['x'], ['i', 'r'], event)).toBe(false);
  });

  it('returns false for an empty buffer', () => {
    const event = makeEvent({ key: 'i' });
    expect(isSequencePrefix([], ['i', 'r'], event)).toBe(false);
  });
});
