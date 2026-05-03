import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';

vi.mock('@/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => `i18n(${key})`),
}));

import { useJsonSourceInput } from '../../src/components/UI/ImportExportWizards/Source/useJsonSourceInput';

const payloadSchema = z.object({ name: z.string() });

const validate = (raw: unknown) => {
  const data = payloadSchema.parse(raw);
  return { data, note: (raw as { note?: string }).note ?? null };
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useJsonSourceInput', () => {
  it('démarre en mode file avec un état vide', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate));
    expect(result.current.sourceMode).toBe('file');
    expect(result.current.parsedData).toBeNull();
    expect(result.current.parseError).toBeNull();
    expect(result.current.importedNote).toBeNull();
    expect(result.current.fileName).toBeNull();
    expect(result.current.isDragOver).toBe(false);
  });

  it('parse du JSON valide via handleTextChange', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate));
    act(() => {
      result.current.handleTextChange('{"name":"Alice","note":"hello"}');
    });
    expect(result.current.parsedData).toEqual({ name: 'Alice' });
    expect(result.current.importedNote).toBe('hello');
    expect(result.current.parseError).toBeNull();
  });

  it('réinitialise le résultat parsé quand le texte est vidé', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate));
    act(() => result.current.handleTextChange('{"name":"Alice"}'));
    expect(result.current.parsedData).not.toBeNull();
    act(() => result.current.handleTextChange('   '));
    expect(result.current.parsedData).toBeNull();
    expect(result.current.parseError).toBeNull();
  });

  it('signale un message i18n pour les SyntaxError JSON', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate));
    act(() => result.current.handleTextChange('{not json'));
    expect(result.current.parseError).toBe('i18n(invalidJson)');
    expect(result.current.parsedData).toBeNull();
  });

  it('signale les erreurs Zod ligne par ligne', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate));
    act(() => result.current.handleTextChange('{"name":42}'));
    expect(result.current.parseError).toContain('name:');
    expect(result.current.parsedData).toBeNull();
  });

  it('signale les autres erreurs avec un message générique', () => {
    const customValidate = () => {
      throw new Error('custom');
    };
    const { result } = renderHook(() => useJsonSourceInput(customValidate));
    act(() => result.current.handleTextChange('{"name":"x"}'));
    expect(result.current.parseError).toBe('i18n(errorImportInvalidStructure)');
  });

  it('handleDragOver active le drag, handleDragLeave le désactive', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate));
    const event = { preventDefault: vi.fn() } as unknown as React.DragEvent;
    act(() => result.current.handleDragOver(event));
    expect(result.current.isDragOver).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();

    act(() => result.current.handleDragLeave());
    expect(result.current.isDragOver).toBe(false);
  });

  it('handleDrop ignore les fichiers non .json', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate));
    const file = new File(['data'], 'note.txt', { type: 'text/plain' });
    const event = {
      preventDefault: vi.fn(),
      dataTransfer: { files: [file] },
    } as unknown as React.DragEvent;
    act(() => result.current.handleDrop(event));
    expect(result.current.fileName).toBeNull();
    expect(result.current.parsedData).toBeNull();
  });

  it('reset() restaure tout l\'état initial', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate));
    act(() => result.current.handleTextChange('{"name":"Alice","note":"hi"}'));
    act(() => result.current.setSourceMode('text'));
    expect(result.current.parsedData).not.toBeNull();
    act(() => result.current.reset());
    expect(result.current.sourceMode).toBe('file');
    expect(result.current.jsonText).toBe('');
    expect(result.current.parsedData).toBeNull();
    expect(result.current.parseError).toBeNull();
    expect(result.current.importedNote).toBeNull();
    expect(result.current.fileName).toBeNull();
    expect(result.current.isDragOver).toBe(false);
  });

  it('handleBrowse appelle le click sur la ref de l\'input fichier', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate));
    const click = vi.fn();
    (result.current.fileInputRef as { current: { click: () => void } }).current = { click };
    act(() => result.current.handleBrowse());
    expect(click).toHaveBeenCalled();
  });

  it('setSourceMode bascule entre les modes', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate));
    act(() => result.current.setSourceMode('text'));
    expect(result.current.sourceMode).toBe('text');
    act(() => result.current.setSourceMode('pack'));
    expect(result.current.sourceMode).toBe('pack');
  });
});
