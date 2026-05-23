import React from 'react';
import { Flex, IconButton, Tooltip } from '@radix-ui/themes';
import { Camera, Monitor, Replace, RotateCcw, Square, Wrench } from 'lucide-react';
import { SplitButton } from '@/components/UI/SplitButton/SplitButton';
import { getMessage } from '@/utils/i18n';
import type { Session } from '@/types/session';

export interface SessionRestoreButtonProps {
  session: Session;
  onRestoreCurrentWindow: (session: Session) => void;
  onRestoreNewWindow: (session: Session) => void;
  onReplaceCurrentWindow: (session: Session) => void;
  onCustomize: (session: Session) => void;
  /** Optional: when provided, renders a Refresh icon button to the left of the restore split button. */
  onRefresh?: (session: Session) => void;
  size?: '1' | '2' | '3';
  variant?: 'solid' | 'soft' | 'outline';
  presentation?: 'default' | 'tile';
  'data-testid'?: string;
}

export function SessionRestoreButton({
  session,
  onRestoreCurrentWindow,
  onRestoreNewWindow,
  onReplaceCurrentWindow,
  onCustomize,
  onRefresh,
  size = '1',
  variant = 'soft',
  presentation = 'default',
  'data-testid': testId,
}: SessionRestoreButtonProps) {
  const isTile = presentation === 'tile';
  const label = isTile ? (
    <Flex align="center" gap="1">
      <RotateCcw size={14} aria-hidden="true" />
      {getMessage('sessionRestore')}
    </Flex>
  ) : (
    <RotateCcw size={12} aria-hidden="true" />
  );

  const splitButton = (
    <SplitButton
      data-testid={testId}
      label={label}
      primaryAriaLabel={getMessage('sessionRestoreCurrentWindow')}
      onClick={() => onRestoreCurrentWindow(session)}
      size={size}
      variant={variant}
      menuItems={[
        {
          label: getMessage('sessionRestoreCurrentWindow'),
          icon: <Monitor size={14} />,
          onClick: () => onRestoreCurrentWindow(session),
          shortcut: 'Shift+R',
          'data-testid': 'session-restore-menu-current-window',
        },
        {
          label: getMessage('sessionRestoreNewWindow'),
          icon: <Square size={14} />,
          onClick: () => onRestoreNewWindow(session),
          shortcut: 'Alt+Shift+R',
          'data-testid': 'session-restore-menu-new-window',
        },
        {
          label: getMessage('sessionRestoreReplaceCurrentWindow'),
          icon: <Replace size={14} />,
          onClick: () => onReplaceCurrentWindow(session),
          shortcut: 'Alt+R',
          'data-testid': 'session-restore-menu-replace-window',
        },
        {
          label: getMessage('sessionRestoreCustomize'),
          icon: <Wrench size={14} />,
          onClick: () => onCustomize(session),
          shortcut: 'R',
          separator: isTile,
          'data-testid': 'session-restore-menu-customize',
        },
      ]}
    />
  );

  if (!onRefresh) return splitButton;

  return (
    <Flex align="center" gap="1">
      <Tooltip content={getMessage('sessionRefresh')}>
        <IconButton
          size={size}
          variant={variant}
          color="gray"
          onClick={() => onRefresh(session)}
          aria-label={getMessage('sessionRefresh')}
          data-testid={testId ? `${testId}-refresh` : undefined}
        >
          <Camera size={isTile ? 14 : 12} aria-hidden="true" />
        </IconButton>
      </Tooltip>
      {splitButton}
    </Flex>
  );
}
