import { describe, it, expect, vi } from 'vitest';

async function loadDisplay(isMac: boolean) {
  vi.resetModules();
  vi.doMock('../../src/utils/platform', () => ({ IS_MAC: isMac }));
  return import('../../src/utils/shortcutDisplay');
}

describe('tokenizeComboForDisplay (Mac)', () => {
  it('produces Apple HIG glyphs for primary modifiers', async () => {
    const { tokenizeComboForDisplay } = await loadDisplay(true);
    expect(tokenizeComboForDisplay('Mod+Shift+R')).toEqual([
      { display: '⌘', accessibleLabel: 'Command', isModifier: true },
      { display: '⇧', accessibleLabel: 'Shift', isModifier: true },
      { display: 'R', accessibleLabel: 'R', isModifier: false },
    ]);
    expect(tokenizeComboForDisplay('Alt+r').map((t) => t.display)).toEqual(['⌥', 'R']);
    expect(tokenizeComboForDisplay('Ctrl+r').map((t) => t.display)).toEqual(['⌃', 'R']);
    vi.doUnmock('../../src/utils/platform');
  });

  it('renders special keys with their canonical glyphs', async () => {
    const { tokenizeComboForDisplay } = await loadDisplay(true);
    expect(tokenizeComboForDisplay('ArrowUp')[0].display).toBe('↑');
    expect(tokenizeComboForDisplay('ArrowDown')[0].display).toBe('↓');
    expect(tokenizeComboForDisplay('ArrowLeft')[0].display).toBe('←');
    expect(tokenizeComboForDisplay('ArrowRight')[0].display).toBe('→');
    expect(tokenizeComboForDisplay('Enter')[0].display).toBe('↵');
    expect(tokenizeComboForDisplay('Escape')[0].display).toBe('Esc');
    expect(tokenizeComboForDisplay('Backspace')[0].display).toBe('⌫');
    expect(tokenizeComboForDisplay('Delete')[0].display).toBe('Del');
    expect(tokenizeComboForDisplay('Space')[0].display).toBe('Space');
    expect(tokenizeComboForDisplay('Tab')[0].display).toBe('Tab');
    expect(tokenizeComboForDisplay('Home')[0].display).toBe('Home');
    expect(tokenizeComboForDisplay('End')[0].display).toBe('End');
    vi.doUnmock('../../src/utils/platform');
  });
});

describe('tokenizeComboForDisplay (non-Mac)', () => {
  it('uses textual labels for modifiers', async () => {
    const { tokenizeComboForDisplay } = await loadDisplay(false);
    expect(tokenizeComboForDisplay('Mod+Shift+R')).toEqual([
      { display: 'Ctrl', accessibleLabel: 'Control', isModifier: true },
      { display: 'Shift', accessibleLabel: 'Shift', isModifier: true },
      { display: 'R', accessibleLabel: 'R', isModifier: false },
    ]);
    expect(tokenizeComboForDisplay('Alt+r').map((t) => t.display)).toEqual(['Alt', 'R']);
    expect(tokenizeComboForDisplay('Meta+r').map((t) => t.display)).toEqual(['Win', 'R']);
    vi.doUnmock('../../src/utils/platform');
  });

  it('uppercases single ASCII letters', async () => {
    const { tokenizeComboForDisplay } = await loadDisplay(false);
    expect(tokenizeComboForDisplay('r')[0].display).toBe('R');
    expect(tokenizeComboForDisplay('?')[0].display).toBe('?');
    expect(tokenizeComboForDisplay('/')[0].display).toBe('/');
    expect(tokenizeComboForDisplay('1')[0].display).toBe('1');
    vi.doUnmock('../../src/utils/platform');
  });
});

describe('formatComboForA11y', () => {
  it('joins with spaces on Mac', async () => {
    const { formatComboForA11y } = await loadDisplay(true);
    expect(formatComboForA11y('Mod+Shift+R')).toBe('Command Shift R');
    expect(formatComboForA11y('Alt+ArrowUp')).toBe('Option Arrow Up');
    vi.doUnmock('../../src/utils/platform');
  });

  it('joins with " + " on non-Mac', async () => {
    const { formatComboForA11y } = await loadDisplay(false);
    expect(formatComboForA11y('Mod+Shift+R')).toBe('Control + Shift + R');
    expect(formatComboForA11y('Alt+ArrowUp')).toBe('Alt + Arrow Up');
    vi.doUnmock('../../src/utils/platform');
  });
});

describe('formatSequenceForA11y', () => {
  it('joins each combo with the localized separator', async () => {
    const { formatSequenceForA11y } = await loadDisplay(false);
    expect(formatSequenceForA11y(['i', 'r'], 'then')).toBe('I then R');
    expect(formatSequenceForA11y(['e', 's'], 'then')).toBe('E then S');
    vi.doUnmock('../../src/utils/platform');
  });

  it('honors the separator on Mac builds too', async () => {
    const { formatSequenceForA11y } = await loadDisplay(true);
    expect(formatSequenceForA11y(['i', 'r'], 'puis')).toBe('I puis R');
    vi.doUnmock('../../src/utils/platform');
  });

  it('returns a single combo unchanged when sequence has length 1', async () => {
    const { formatSequenceForA11y } = await loadDisplay(false);
    expect(formatSequenceForA11y(['i'], 'then')).toBe('I');
    vi.doUnmock('../../src/utils/platform');
  });
});
