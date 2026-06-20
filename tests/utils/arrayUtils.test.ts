import { describe, it, expect } from 'vitest';
import { toggleInArray } from '../../src/utils/arrayUtils';

describe('toggleInArray', () => {
  it('adds the item when checked and absent', () => {
    expect(toggleInArray([1, 2], 3, true)).toEqual([1, 2, 3]);
  });

  it('does not duplicate when checked and already present', () => {
    expect(toggleInArray([1, 2, 3], 2, true)).toEqual([1, 2, 3]);
  });

  it('removes the item when unchecked and present', () => {
    expect(toggleInArray([1, 2, 3], 2, false)).toEqual([1, 3]);
  });

  it('is a no-op when unchecked and absent', () => {
    expect(toggleInArray([1, 2], 9, false)).toEqual([1, 2]);
  });

  it('preserves the original order when adding', () => {
    expect(toggleInArray(['b', 'a'], 'c', true)).toEqual(['b', 'a', 'c']);
  });

  it('removes every occurrence of a duplicated value', () => {
    // Pre-existing duplicates are not the function contract, but uncheck must
    // strip all matches to leave the value fully absent.
    expect(toggleInArray([1, 2, 2, 3], 2, false)).toEqual([1, 3]);
  });

  it('returns a fresh array, never the same reference', () => {
    const input = [1, 2];
    expect(toggleInArray(input, 3, true)).not.toBe(input);
    expect(toggleInArray(input, 9, true)).not.toBe(input); // add branch
    expect(toggleInArray(input, 1, true)).not.toBe(input); // already-present branch
    expect(toggleInArray(input, 1, false)).not.toBe(input); // remove branch
  });

  it('does not mutate the input array', () => {
    const input = [1, 2, 3];
    toggleInArray(input, 4, true);
    toggleInArray(input, 2, false);
    expect(input).toEqual([1, 2, 3]);
  });

  it('uses strict (referential) equality for objects', () => {
    const a = { id: 1 };
    const b = { id: 1 };
    // b is a different reference, so removing it leaves a untouched.
    expect(toggleInArray([a], b, false)).toEqual([a]);
    // The same reference is removed.
    expect(toggleInArray([a], a, false)).toEqual([]);
  });
});
