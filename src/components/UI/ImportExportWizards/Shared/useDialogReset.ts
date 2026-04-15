import { useEffect, useRef } from 'react';

/**
 * Runs `reset` each time `open` transitions to `true`.
 * Used by wizards to clear ephemeral state when the dialog is reopened.
 * The latest `reset` callback is captured via a ref so changing it between
 * renders does not retrigger the effect.
 */
export function useDialogReset(open: boolean, reset: () => void): void {
  const resetRef = useRef(reset);
  resetRef.current = reset;

  useEffect(() => {
    if (open) resetRef.current();
  }, [open]);
}
