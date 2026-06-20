import type React from 'react';

/**
 * Returns a `onKeyDown` handler for edit-row inputs.
 * Pressing Enter confirms the edit; pressing Escape cancels it.
 */
export function makeEditKeyDownHandler(
  onSave: () => void,
  onCancel: () => void,
): (e: React.KeyboardEvent) => void {
  return (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSave();
    if (e.key === 'Escape') onCancel();
  };
}
