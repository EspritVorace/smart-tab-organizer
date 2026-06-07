import { describe, it, expect } from 'vitest';
import { stableSortByKey, type SortKey } from '../../src/utils/sortUtils';

interface Item {
  id: string;
  key: string;
  missing?: boolean;
}

const keyOf = (item: Item): SortKey => ({ key: item.key, missing: item.missing ?? false });
const ids = (items: Item[]) => items.map(i => i.id);

describe('stableSortByKey', () => {
  it('sorts ascending by key', () => {
    const items: Item[] = [
      { id: 'b', key: 'banana' },
      { id: 'a', key: 'apple' },
      { id: 'c', key: 'cherry' },
    ];
    expect(ids(stableSortByKey(items, keyOf, 'asc'))).toEqual(['a', 'b', 'c']);
  });

  it('sorts descending by key', () => {
    const items: Item[] = [
      { id: 'b', key: 'banana' },
      { id: 'a', key: 'apple' },
      { id: 'c', key: 'cherry' },
    ];
    expect(ids(stableSortByKey(items, keyOf, 'desc'))).toEqual(['c', 'b', 'a']);
  });

  it('keeps missing values last regardless of direction', () => {
    const items: Item[] = [
      { id: 'a', key: 'apple' },
      { id: 'x', key: '', missing: true },
      { id: 'b', key: 'banana' },
    ];
    expect(ids(stableSortByKey(items, keyOf, 'asc'))).toEqual(['a', 'b', 'x']);
    expect(ids(stableSortByKey(items, keyOf, 'desc'))).toEqual(['b', 'a', 'x']);
  });

  it('is stable: equal keys keep their original order', () => {
    const items: Item[] = [
      { id: 'a1', key: 'same' },
      { id: 'a2', key: 'same' },
      { id: 'a3', key: 'same' },
    ];
    expect(ids(stableSortByKey(items, keyOf, 'asc'))).toEqual(['a1', 'a2', 'a3']);
    expect(ids(stableSortByKey(items, keyOf, 'desc'))).toEqual(['a1', 'a2', 'a3']);
  });

  it('keeps multiple missing values in their original order', () => {
    const items: Item[] = [
      { id: 'm1', key: '', missing: true },
      { id: 'a', key: 'apple' },
      { id: 'm2', key: '', missing: true },
    ];
    expect(ids(stableSortByKey(items, keyOf, 'asc'))).toEqual(['a', 'm1', 'm2']);
  });

  it('does not mutate the input array', () => {
    const items: Item[] = [
      { id: 'b', key: 'banana' },
      { id: 'a', key: 'apple' },
    ];
    stableSortByKey(items, keyOf, 'asc');
    expect(ids(items)).toEqual(['b', 'a']);
  });
});
