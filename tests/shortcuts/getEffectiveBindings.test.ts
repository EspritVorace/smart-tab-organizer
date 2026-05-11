import { describe, it, expect } from 'vitest';
import {
  getEffectiveBindings,
  getEffectiveBindingsAsync,
} from '../../src/shortcuts/getEffectiveBindings';
import { SHORTCUTS_REGISTRY } from '../../src/shortcuts/registry';

describe('getEffectiveBindings', () => {
  it('returns the registry defaultBindings for a known id', () => {
    const id = 'global.organize';
    expect(getEffectiveBindings(id)).toBe(SHORTCUTS_REGISTRY[id].defaultBindings);
  });

  it('returns matching defaults for every registry entry', () => {
    for (const [id, entry] of Object.entries(SHORTCUTS_REGISTRY)) {
      expect(getEffectiveBindings(id)).toEqual(entry.defaultBindings);
    }
  });

  it('returns an empty array for an unknown id (graceful)', () => {
    expect(getEffectiveBindings('does.not.exist')).toEqual([]);
  });

  it('async variant matches the sync one', async () => {
    await expect(getEffectiveBindingsAsync('global.organize')).resolves.toEqual(
      getEffectiveBindings('global.organize'),
    );
    await expect(getEffectiveBindingsAsync('does.not.exist')).resolves.toEqual([]);
  });
});
