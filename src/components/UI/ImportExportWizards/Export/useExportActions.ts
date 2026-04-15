import { useCallback } from 'react';
import { getMessage } from '../../../../utils/i18n';
import { showSuccessNotification } from '../../../../utils/notifications';

export interface ExportActionsConfig {
  /** Filename suggested when the native Save As dialog opens. */
  filename: string;
  /** i18n key used as the success notification title. */
  notifyTitleKey: string;
  /**
   * Notification body. Either an i18n key whose message is used as-is, or a
   * resolver called with the number of selected items (for sessions).
   */
  notifyMessage: string | ((count: number) => string);
  /** Selected entities used to produce the exported JSON. */
  selected: readonly unknown[];
  /** Optional free-form note persisted at the top of the JSON payload. */
  note: string;
  /** Builds the JSON string from the current `selected` + `note` state. */
  buildJson: () => string;
  /** Called after a successful export (both file and clipboard paths). */
  onFinish: () => void;
}

export interface ExportActions {
  exportToFile: () => Promise<void>;
  exportToClipboard: () => Promise<void>;
}

function resolveMessage(
  notifyMessage: string | ((count: number) => string),
  count: number,
): string {
  return typeof notifyMessage === 'function'
    ? notifyMessage(count)
    : getMessage(notifyMessage);
}

/**
 * Generic "export selected items as JSON" handlers shared by every export
 * wizard. Handles the Chrome `showSaveFilePicker` path, the Firefox blob
 * download fallback, clipboard export, and the success notification.
 */
export function useExportActions(config: ExportActionsConfig): ExportActions {
  const { filename, notifyTitleKey, notifyMessage, selected, buildJson, onFinish } = config;

  const notify = useCallback(() => {
    showSuccessNotification(
      getMessage(notifyTitleKey),
      resolveMessage(notifyMessage, selected.length),
    );
  }, [notifyTitleKey, notifyMessage, selected.length]);

  const exportToFile = useCallback(async () => {
    const json = buildJson();

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as unknown as {
          showSaveFilePicker: (opts: unknown) => Promise<{
            createWritable: () => Promise<{
              write: (data: string) => Promise<void>;
              close: () => Promise<void>;
            }>;
          }>;
        }).showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
        onFinish();
        notify();
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        throw err;
      }
      return;
    }

    // Fallback for Firefox / older browsers
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onFinish();
    notify();
  }, [buildJson, filename, onFinish, notify]);

  const exportToClipboard = useCallback(async () => {
    const json = buildJson();
    await navigator.clipboard.writeText(json);
    onFinish();
    notify();
  }, [buildJson, onFinish, notify]);

  return { exportToFile, exportToClipboard };
}
