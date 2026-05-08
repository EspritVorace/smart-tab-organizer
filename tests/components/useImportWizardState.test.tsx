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
  it('transmet initialSourceMode à useJsonSourceInput', () => {
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

  it("avance automatiquement à l'étape 1 quand mode=pack et parsedData devient non-null", () => {
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

  it("reste à l'étape 0 quand mode=file et parsedData devient non-null", () => {
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
