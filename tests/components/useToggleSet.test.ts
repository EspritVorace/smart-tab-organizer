import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToggleSet } from '../../src/components/UI/ImportExportWizards/Shared/useToggleSet';

describe('useToggleSet', () => {
  it('initialises with an empty set by default', () => {
    const { result } = renderHook(() => useToggleSet());
    expect(result.current.size).toBe(0);
    expect(result.current.ids.size).toBe(0);
  });

  it('initialises with the provided ids', () => {
    const { result } = renderHook(() => useToggleSet(['a', 'b']));
    expect(result.current.size).toBe(2);
    expect(result.current.has('a')).toBe(true);
    expect(result.current.has('b')).toBe(true);
  });

  it('toggle adds an id that is not present', () => {
    const { result } = renderHook(() => useToggleSet<string>());
    act(() => result.current.toggle('x'));
    expect(result.current.has('x')).toBe(true);
    expect(result.current.size).toBe(1);
  });

  it('toggle removes an id that is already present', () => {
    const { result } = renderHook(() => useToggleSet(['x']));
    act(() => result.current.toggle('x'));
    expect(result.current.has('x')).toBe(false);
    expect(result.current.size).toBe(0);
  });

  it('setAll replaces the set with new ids', () => {
    const { result } = renderHook(() => useToggleSet(['a']));
    act(() => result.current.setAll(['b', 'c']));
    expect(result.current.has('a')).toBe(false);
    expect(result.current.has('b')).toBe(true);
    expect(result.current.has('c')).toBe(true);
    expect(result.current.size).toBe(2);
  });

  it('clearAll empties the set', () => {
    const { result } = renderHook(() => useToggleSet(['a', 'b', 'c']));
    act(() => result.current.clearAll());
    expect(result.current.size).toBe(0);
  });
});
