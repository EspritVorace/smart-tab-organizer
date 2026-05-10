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
  it('starts in file mode with an empty state', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate));
    expect(result.current.sourceMode).toBe('file');
    expect(result.current.parsedData).toBeNull();
    expect(result.current.parseError).toBeNull();
    expect(result.current.importedNote).toBeNull();
    expect(result.current.fileName).toBeNull();
    expect(result.current.isDragOver).toBe(false);
  });

  it('parses valid JSON through handleTextChange', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate));
    act(() => {
      result.current.handleTextChange('{"name":"Alice","note":"hello"}');
    });
    expect(result.current.parsedData).toEqual({ name: 'Alice' });
    expect(result.current.importedNote).toBe('hello');
    expect(result.current.parseError).toBeNull();
  });

  it('clears the parsed result when the text is cleared', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate));
    act(() => result.current.handleTextChange('{"name":"Alice"}'));
    expect(result.current.parsedData).not.toBeNull();
    act(() => result.current.handleTextChange('   '));
    expect(result.current.parsedData).toBeNull();
    expect(result.current.parseError).toBeNull();
  });

  it('reports an i18n message for JSON SyntaxErrors', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate));
    act(() => result.current.handleTextChange('{not json'));
    expect(result.current.parseError).toBe('i18n(invalidJson)');
    expect(result.current.parsedData).toBeNull();
  });

  it('reports Zod errors line by line', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate));
    act(() => result.current.handleTextChange('{"name":42}'));
    expect(result.current.parseError).toContain('name:');
    expect(result.current.parsedData).toBeNull();
  });

  it('reports other errors with a generic message', () => {
    const customValidate = () => {
      throw new Error('custom');
    };
    const { result } = renderHook(() => useJsonSourceInput(customValidate));
    act(() => result.current.handleTextChange('{"name":"x"}'));
    expect(result.current.parseError).toBe('i18n(errorImportInvalidStructure)');
  });

  it('handleDragOver activates the drag, handleDragLeave deactivates it', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate));
    const event = { preventDefault: vi.fn() } as unknown as React.DragEvent;
    act(() => result.current.handleDragOver(event));
    expect(result.current.isDragOver).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();

    act(() => result.current.handleDragLeave());
    expect(result.current.isDragOver).toBe(false);
  });

  it('handleDrop ignores non-.json files', () => {
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

  it('reset() restores the entire initial state', () => {
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

  it('handleBrowse clicks on the file input ref', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate));
    const click = vi.fn();
    (result.current.fileInputRef as { current: { click: () => void } }).current = { click };
    act(() => result.current.handleBrowse());
    expect(click).toHaveBeenCalled();
  });

  it('setSourceMode toggles between modes', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate));
    act(() => result.current.setSourceMode('text'));
    expect(result.current.sourceMode).toBe('text');
    act(() => result.current.setSourceMode('pack'));
    expect(result.current.sourceMode).toBe('pack');
  });

  it('initialSourceMode sets the initial mode', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate, 'pack'));
    expect(result.current.sourceMode).toBe('pack');
  });

  it('reset() restores initialSourceMode rather than a hard-coded file mode', () => {
    const { result } = renderHook(() => useJsonSourceInput(validate, 'pack'));
    act(() => result.current.setSourceMode('text'));
    expect(result.current.sourceMode).toBe('text');
    act(() => result.current.reset());
    expect(result.current.sourceMode).toBe('pack');
  });
});
