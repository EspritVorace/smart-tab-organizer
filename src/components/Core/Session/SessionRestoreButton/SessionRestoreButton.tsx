import React from 'react';
import { Monitor, Play, Replace, Square, Wrench } from 'lucide-react';
import { SplitButton } from '@/components/UI/SplitButton/SplitButton';
import { getMessage } from '@/utils/i18n';
import type { Session } from '@/types/session';

export interface SessionRestoreButtonProps {
  session: Session;
  onRestoreCurrentWindow: (session: Session) => void;
  onRestoreNewWindow: (session: Session) => void;
  onReplaceCurrentWindow: (session: Session) => void;
  onCustomize: (session: Session) => void;
  size?: '1' | '2' | '3';
  variant?: 'solid' | 'soft' | 'outline';
  'data-testid'?: string;
}

export function SessionRestoreButton({
  session,
  onRestoreCurrentWindow,
  onRestoreNewWindow,
  onReplaceCurrentWindow,
  onCustomize,
  size = '1',
  variant = 'soft',
  'data-testid': testId,
}: SessionRestoreButtonProps) {
  return (
    <SplitButton
      data-testid={testId}
      label={<Play size={12} aria-hidden="true" fill="currentColor" />}
      primaryAriaLabel={getMessage('sessionRestoreCurrentWindow')}
      onClick={() => onRestoreCurrentWindow(session)}
      size={size}
      variant={variant}
      menuItems={[
        {
          label: getMessage('sessionRestoreCurrentWindow'),
          icon: <Monitor size={14} aria-hidden="true" />,
          onClick: () => onRestoreCurrentWindow(session),
        },
        {
          label: getMessage('sessionRestoreNewWindow'),
          icon: <Square size={14} aria-hidden="true" />,
          onClick: () => onRestoreNewWindow(session),
        },
        {
          label: getMessage('sessionRestoreReplaceCurrentWindow'),
          icon: <Replace size={14} aria-hidden="true" />,
          onClick: () => onReplaceCurrentWindow(session),
        },
        {
          label: getMessage('sessionRestoreCustomize'),
          icon: <Wrench size={14} aria-hidden="true" />,
          onClick: () => onCustomize(session),
        },
      ]}
    />
  );
}
