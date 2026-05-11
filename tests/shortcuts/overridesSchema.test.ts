import { describe, it, expect } from 'vitest';
import { ShortcutOverridesSchema } from '../../src/shortcuts/overridesSchema';

describe('ShortcutOverridesSchema', () => {
  it('accepts a single combo override', () => {
    const result = ShortcutOverridesSchema.safeParse({
      'popup.save': ['Mod+S'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a sequence override (>= 2 keys)', () => {
    const result = ShortcutOverridesSchema.safeParse({
      'importexport.import.rules': [['g', 'i', 'r']],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a mix of combos and sequences for the same id', () => {
    const result = ShortcutOverridesSchema.safeParse({
      'popup.save': ['Mod+S', ['s', 's']],
    });
    expect(result.success).toBe(true);
  });

  it('accepts an empty array (user disabled the shortcut)', () => {
    const result = ShortcutOverridesSchema.safeParse({
      'sessionCard.restore.custom': [],
    });
    expect(result.success).toBe(true);
  });

  it('accepts an empty record (no overrides)', () => {
    const result = ShortcutOverridesSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects a 1-element sequence', () => {
    const result = ShortcutOverridesSchema.safeParse({
      'importexport.import.rules': [['i']],
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-string entries inside a sequence', () => {
    const result = ShortcutOverridesSchema.safeParse({
      'importexport.import.rules': [['i', 42]],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a top-level value that is not an array', () => {
    const result = ShortcutOverridesSchema.safeParse({
      'popup.save': 'Mod+S',
    });
    expect(result.success).toBe(false);
  });
});
