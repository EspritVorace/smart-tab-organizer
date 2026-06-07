import React, { useCallback, useState } from 'react';
import { useShortcuts } from '@/hooks/useShortcuts.js';
import {
  switchWorkspaceRelative,
  type WorkspaceSwitchDirection,
  type WorkspaceSwitchOutcome,
} from '@/utils/workspaceSwitch.js';
import { getMessage } from '@/utils/i18n.js';
import { logger } from '@/utils/logger.js';

interface WorkspaceSwitchShortcutsProps {
  /**
   * Forwarded to `useShortcuts` so the host surface can render its sequence
   * indicator while the `w` prefix is buffered (options page). Omitted in the
   * popup, which has no indicator.
   */
  onSequenceState?: (state: { activePrefix: string[] | null }) => void;
}

/** Invisible, unspoken character toggled to force re-announcement of identical
 *  consecutive messages in the aria-live region (U+200B zero-width space). */
const ZERO_WIDTH_SPACE = String.fromCharCode(0x200b);

const SR_ONLY: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

function buildAnnouncement(outcome: WorkspaceSwitchOutcome): string {
  if (!outcome.switched) {
    return getMessage('workspaceSwitchUnavailableAnnounce');
  }
  const name = outcome.active?.name ?? getMessage('workspaceDefaultName');
  return getMessage('workspaceSwitchedAnnounce', name);
}

/**
 * Non-visual companion that wires the workspace-switch keyboard sequences
 * (`w n` next, `w p` previous, `w l` last used) at the `global` scope and
 * announces the result through an aria-live region. Mounted in both the popup
 * and the options surface so the same gestures work everywhere; the underlying
 * `switchWorkspaceRelative` handler is shared with the background command layer.
 */
export function WorkspaceSwitchShortcuts({ onSequenceState }: WorkspaceSwitchShortcutsProps) {
  // `nonce` parity toggles a trailing zero-width space so two identical
  // consecutive messages (e.g. repeated "no other workspace") still re-announce.
  const [announcement, setAnnouncement] = useState('');
  const [nonce, setNonce] = useState(0);

  const handleSwitch = useCallback((direction: WorkspaceSwitchDirection) => {
    switchWorkspaceRelative(direction)
      .then((outcome) => {
        setAnnouncement(buildAnnouncement(outcome));
        setNonce((n) => n + 1);
      })
      .catch((error) => logger.error('[WORKSPACE_SWITCH] failed:', error));
  }, []);

  useShortcuts(
    {
      'workspace.next': () => handleSwitch('next'),
      'workspace.prev': () => handleSwitch('prev'),
      'workspace.last': () => handleSwitch('last'),
    },
    { scope: 'global', onSequenceState },
  );

  const text =
    announcement === '' || nonce % 2 === 0 ? announcement : `${announcement}${ZERO_WIDTH_SPACE}`;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="workspace-switch-announcer"
      style={SR_ONLY}
    >
      {text}
    </div>
  );
}
