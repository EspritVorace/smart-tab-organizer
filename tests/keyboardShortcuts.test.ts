import assert from 'assert';
import {
  parseCombo,
  matchesShortcut,
  isTypingTarget,
  isDialogOpen,
  shouldFire,
} from '../src/utils/keyboardShortcuts';

function makeEvent(init: Partial<KeyboardEventInit> & { key: string; code?: string; target?: EventTarget }): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: init.key,
    code: init.code,
    shiftKey: init.shiftKey ?? false,
    altKey: init.altKey ?? false,
    ctrlKey: init.ctrlKey ?? false,
    metaKey: init.metaKey ?? false,
  });
  if (init.target) {
    Object.defineProperty(event, 'target', { value: init.target });
  }
  return event;
}

test('parseCombo extracts key and modifiers', () => {
  assert.deepStrictEqual(parseCombo('r'), { key: 'r', shift: false, alt: false, ctrl: false, meta: false });
  assert.deepStrictEqual(parseCombo('Shift+r'), { key: 'r', shift: true, alt: false, ctrl: false, meta: false });
  assert.deepStrictEqual(parseCombo('Alt+Shift+R'), { key: 'r', shift: true, alt: true, ctrl: false, meta: false });
  assert.deepStrictEqual(parseCombo('Alt+1'), { key: '1', shift: false, alt: true, ctrl: false, meta: false });
  assert.deepStrictEqual(parseCombo('?'), { key: '?', shift: false, alt: false, ctrl: false, meta: false });
});

test('matchesShortcut: plain letter without modifiers', () => {
  assert.strictEqual(matchesShortcut(makeEvent({ key: 'r' }), 'r'), true);
  assert.strictEqual(matchesShortcut(makeEvent({ key: 'R' }), 'r'), true, 'CapsLock should match');
  assert.strictEqual(matchesShortcut(makeEvent({ key: 'r', shiftKey: true }), 'r'), false, 'Shift+r != r');
  assert.strictEqual(matchesShortcut(makeEvent({ key: 'r', altKey: true }), 'r'), false);
});

test('matchesShortcut: Shift+r distinguishes from r', () => {
  assert.strictEqual(matchesShortcut(makeEvent({ key: 'r', shiftKey: true }), 'Shift+r'), true);
  assert.strictEqual(matchesShortcut(makeEvent({ key: 'R', shiftKey: true }), 'Shift+r'), true);
  assert.strictEqual(matchesShortcut(makeEvent({ key: 'r' }), 'Shift+r'), false);
});

test('matchesShortcut: Alt+r and Alt+Shift+r', () => {
  assert.strictEqual(matchesShortcut(makeEvent({ key: 'r', altKey: true }), 'Alt+r'), true);
  assert.strictEqual(matchesShortcut(makeEvent({ key: 'r', altKey: true, shiftKey: true }), 'Alt+r'), false);
  assert.strictEqual(matchesShortcut(makeEvent({ key: 'r', altKey: true, shiftKey: true }), 'Alt+Shift+r'), true);
});

test('matchesShortcut: Alt+1 number keys', () => {
  assert.strictEqual(matchesShortcut(makeEvent({ key: '1', altKey: true }), 'Alt+1'), true);
  assert.strictEqual(matchesShortcut(makeEvent({ key: '1' }), 'Alt+1'), false);
});

test('matchesShortcut: digit shortcuts work on layouts where the key emits a different character (AZERTY Alt+1 -> "&")', () => {
  // On French AZERTY, Alt+1 dispatches event.key = "&" with event.code = "Digit1".
  assert.strictEqual(
    matchesShortcut(makeEvent({ key: '&', code: 'Digit1', altKey: true }), 'Alt+1'),
    true,
  );
  // The fallback only kicks in for the matching code: Digit2 must not match Alt+1.
  assert.strictEqual(
    matchesShortcut(makeEvent({ key: 'é', code: 'Digit2', altKey: true }), 'Alt+1'),
    false,
  );
  // Modifiers still required: pressing the same physical key without Alt does not match.
  assert.strictEqual(
    matchesShortcut(makeEvent({ key: '&', code: 'Digit1' }), 'Alt+1'),
    false,
  );
});

test('matchesShortcut: ? ignores shift since most layouts require shift to type it', () => {
  assert.strictEqual(matchesShortcut(makeEvent({ key: '?' }), '?'), true);
  assert.strictEqual(matchesShortcut(makeEvent({ key: '?', shiftKey: true }), '?'), true);
});

test('matchesShortcut: / ignores shift (French AZERTY emits / via Shift+:)', () => {
  assert.strictEqual(matchesShortcut(makeEvent({ key: '/' }), '/'), true);
  assert.strictEqual(matchesShortcut(makeEvent({ key: '/', shiftKey: true }), '/'), true);
});

test('matchesShortcut: Escape and / and named keys', () => {
  assert.strictEqual(matchesShortcut(makeEvent({ key: 'Escape' }), 'Escape'), true);
  assert.strictEqual(matchesShortcut(makeEvent({ key: '/' }), '/'), true);
  assert.strictEqual(matchesShortcut(makeEvent({ key: 'ArrowDown' }), 'ArrowDown'), true);
});

test('isTypingTarget: detects INPUT, TEXTAREA, contenteditable', () => {
  document.body.innerHTML = '';
  const input = document.createElement('input');
  const textarea = document.createElement('textarea');
  const div = document.createElement('div');
  const editable = document.createElement('div');
  editable.setAttribute('contenteditable', 'true');
  document.body.append(input, textarea, div, editable);
  const button = document.createElement('button');
  assert.strictEqual(isTypingTarget(input), true);
  assert.strictEqual(isTypingTarget(textarea), true);
  assert.strictEqual(isTypingTarget(editable), true);
  assert.strictEqual(isTypingTarget(div), false);
  assert.strictEqual(isTypingTarget(button), false);
  assert.strictEqual(isTypingTarget(null), false);
  document.body.innerHTML = '';
});

test('isDialogOpen: detects open Radix dialog', () => {
  document.body.innerHTML = '';
  assert.strictEqual(isDialogOpen(), false);
  const dialog = document.createElement('div');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('data-state', 'open');
  document.body.appendChild(dialog);
  assert.strictEqual(isDialogOpen(), true);
  dialog.setAttribute('data-state', 'closed');
  assert.strictEqual(isDialogOpen(), false);
  document.body.innerHTML = '';
});

test('shouldFire: skips when typing in input', () => {
  const input = document.createElement('input');
  document.body.appendChild(input);
  const event = makeEvent({ key: 'r', target: input });
  let called = false;
  const def = { combo: 'r', action: () => { called = true; } };
  assert.strictEqual(shouldFire(event, def), false);
  assert.strictEqual(called, false);
  document.body.innerHTML = '';
});

test('shouldFire: allows in input when allowInTypingTarget=true', () => {
  const input = document.createElement('input');
  document.body.appendChild(input);
  const event = makeEvent({ key: 'Escape', target: input });
  assert.strictEqual(
    shouldFire(event, { combo: 'Escape', allowInTypingTarget: true, action: () => {} }),
    true,
  );
  document.body.innerHTML = '';
});

test('shouldFire: skips when target is within excludeIfTargetWithin selector', () => {
  document.body.innerHTML = '';
  const card = document.createElement('div');
  card.setAttribute('data-popup-pinned-card', '');
  const inner = document.createElement('span');
  card.appendChild(inner);
  document.body.appendChild(card);
  const event = makeEvent({ key: 'r', target: inner });
  assert.strictEqual(
    shouldFire(event, { combo: 'r', excludeIfTargetWithin: '[data-popup-pinned-card]', action: () => {} }),
    false,
  );
  // Same shortcut without the exclusion fires.
  assert.strictEqual(
    shouldFire(event, { combo: 'r', action: () => {} }),
    true,
  );
  document.body.innerHTML = '';
});

test('shouldFire: skips when dialog is open unless allowWhenDialogOpen', () => {
  document.body.innerHTML = '';
  const dialog = document.createElement('div');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('data-state', 'open');
  document.body.appendChild(dialog);
  const event = makeEvent({ key: 'r' });
  assert.strictEqual(shouldFire(event, { combo: 'r', action: () => {} }), false);
  assert.strictEqual(
    shouldFire(event, { combo: 'r', allowWhenDialogOpen: true, action: () => {} }),
    true,
  );
  document.body.innerHTML = '';
});
