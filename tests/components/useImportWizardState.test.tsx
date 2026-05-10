import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { JsonSourceValidationResult } from '../../src/components/UI/ImportExportWizards/Source';

vi.mock('@/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => `i18n(${key})`),
}));

import { useImportWizardState } from '../../src/components/UI/ImportExportWizards/useImportWizardState';

interface Item {
  id: string;
  label: string;
}

const validate = (raw: unknown): JsonSourceValidationResult<Item[]> => {
  const items = (raw as { items?: Item[] }).items ?? [];
  return { data: items, note: null };
};

const classify = (imported: Item[]) => ({
  newItems: imported,
  conflictingItems: [],
  identicalItems: [],
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useImportWizardState', () => {
  it('forwards initialSourceMode to useJsonSourceInput', () => {
    const { result } = renderHook(() =>
      useImportWizardState<Item, never>({
        open: true,
        existingItems: [],
        validatePayload: validate,
        classify,
        initialSourceMode: 'pack',
      }),
    );
    expect(result.current.source.sourceMode).toBe('pack');
  });

  it('advances to step 1 automatically when mode=pack and parsedData becomes non-null', () => {
    const { result } = renderHook(() =>
      useImportWizardState<Item, never>({
        open: true,
        existingItems: [],
        validatePayload: validate,
        classify,
        initialSourceMode: 'pack',
      }),
    );
    expect(result.current.step).toBe(0);
    act(() => {
      result.current.source.handleTextChange('{"items":[{"id":"1","label":"a"}]}');
    });
    expect(result.current.source.parsedData).toEqual([{ id: '1', label: 'a' }]);
    expect(result.current.step).toBe(1);
  });

  it('stays on step 0 when mode=file and parsedData becomes non-null', () => {
    const { result } = renderHook(() =>
      useImportWizardState<Item, never>({
        open: true,
        existingItems: [],
        validatePayload: validate,
        classify,
      }),
    );
    expect(result.current.source.sourceMode).toBe('file');
    act(() => {
      result.current.source.handleTextChange('{"items":[{"id":"1","label":"a"}]}');
    });
    expect(result.current.source.parsedData).toEqual([{ id: '1', label: 'a' }]);
    expect(result.current.step).toBe(0);
  });
});
