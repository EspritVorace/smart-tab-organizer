import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => `i18n(${key})`),
}));

const showSuccessToast = vi.fn();
vi.mock('@/utils/toast', () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
}));

import { useExportActions } from '../../src/components/UI/ImportExportWizards/Export/useExportActions';

const baseConfig = {
  filename: 'export.json',
  notifyTitleKey: 'exportTitle',
  selected: [{ id: 'a' }, { id: 'b' }] as const,
  note: '',
  buildJson: () => '{"hello":"world"}',
};

beforeEach(() => {
  showSuccessToast.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as { showSaveFilePicker?: unknown }).showSaveFilePicker;
});

describe('useExportActions', () => {
  it('exporte via showSaveFilePicker quand disponible', async () => {
    const writeMock = vi.fn().mockResolvedValue(undefined);
    const closeMock = vi.fn().mockResolvedValue(undefined);
    const createWritableMock = vi.fn().mockResolvedValue({ write: writeMock, close: closeMock });
    const showSaveFilePicker = vi.fn().mockResolvedValue({ createWritable: createWritableMock });
    (window as unknown as { showSaveFilePicker: unknown }).showSaveFilePicker = showSaveFilePicker;

    const onFinish = vi.fn();
    const { result } = renderHook(() =>
      useExportActions({
        ...baseConfig,
        notifyMessage: 'plainKey',
        onFinish,
      }),
    );

    await act(async () => {
      await result.current.exportToFile();
    });

    expect(showSaveFilePicker).toHaveBeenCalledWith(
      expect.objectContaining({ suggestedName: 'export.json' }),
    );
    expect(writeMock).toHaveBeenCalledWith('{"hello":"world"}');
    expect(closeMock).toHaveBeenCalled();
    expect(onFinish).toHaveBeenCalled();
    expect(showSuccessToast).toHaveBeenCalledWith('i18n(exportTitle)', 'i18n(plainKey)');
  });

  it('utilise un message factory quand notifyMessage est une fonction', async () => {
    const writeMock = vi.fn().mockResolvedValue(undefined);
    const closeMock = vi.fn().mockResolvedValue(undefined);
    (window as unknown as { showSaveFilePicker: unknown }).showSaveFilePicker = vi
      .fn()
      .mockResolvedValue({
        createWritable: vi.fn().mockResolvedValue({ write: writeMock, close: closeMock }),
      });

    const onFinish = vi.fn();
    const messageFactory = vi.fn((count: number) => `${count} sessions exported`);
    const { result } = renderHook(() =>
      useExportActions({
        ...baseConfig,
        notifyMessage: messageFactory,
        onFinish,
      }),
    );

    await act(async () => {
      await result.current.exportToFile();
    });

    expect(messageFactory).toHaveBeenCalledWith(2);
    expect(showSuccessToast).toHaveBeenCalledWith('i18n(exportTitle)', '2 sessions exported');
  });

  it('avale silencieusement les AbortError de la file picker', async () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    (window as unknown as { showSaveFilePicker: unknown }).showSaveFilePicker = vi
      .fn()
      .mockRejectedValue(abort);

    const onFinish = vi.fn();
    const { result } = renderHook(() =>
      useExportActions({ ...baseConfig, notifyMessage: 'k', onFinish }),
    );

    await expect(result.current.exportToFile()).resolves.toBeUndefined();
    expect(onFinish).not.toHaveBeenCalled();
    expect(showSuccessToast).not.toHaveBeenCalled();
  });

  it('relance les autres erreurs de file picker', async () => {
    (window as unknown as { showSaveFilePicker: unknown }).showSaveFilePicker = vi
      .fn()
      .mockRejectedValue(new Error('disk full'));

    const onFinish = vi.fn();
    const { result } = renderHook(() =>
      useExportActions({ ...baseConfig, notifyMessage: 'k', onFinish }),
    );

    await expect(result.current.exportToFile()).rejects.toThrow('disk full');
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('utilise le fallback Blob/anchor quand showSaveFilePicker est absent', async () => {
    const clickMock = vi.fn();
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      if (tag === 'a') {
        const anchor = { href: '', download: '', click: clickMock } as unknown as HTMLAnchorElement;
        return anchor;
      }
      return document.createElementNS('http://www.w3.org/1999/xhtml', tag) as HTMLElement;
    }) as typeof document.createElement);

    const createUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    const revokeUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const onFinish = vi.fn();
    const { result } = renderHook(() =>
      useExportActions({ ...baseConfig, notifyMessage: 'k', onFinish }),
    );

    await act(async () => {
      await result.current.exportToFile();
    });

    expect(createUrlSpy).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
    expect(revokeUrlSpy).toHaveBeenCalledWith('blob:fake');
    expect(onFinish).toHaveBeenCalled();
    expect(showSuccessToast).toHaveBeenCalled();

    createElementSpy.mockRestore();
  });

  it('exporte vers le presse-papiers via navigator.clipboard.writeText', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const onFinish = vi.fn();
    const { result } = renderHook(() =>
      useExportActions({ ...baseConfig, notifyMessage: 'k', onFinish }),
    );

    await act(async () => {
      await result.current.exportToClipboard();
    });

    expect(writeText).toHaveBeenCalledWith('{"hello":"world"}');
    expect(onFinish).toHaveBeenCalled();
    expect(showSuccessToast).toHaveBeenCalled();
  });
});
