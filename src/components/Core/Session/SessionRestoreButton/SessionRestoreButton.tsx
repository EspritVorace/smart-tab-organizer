import React from 'react';
import { Flex, IconButton, Kbd, Tooltip } from '@radix-ui/themes';
import { Camera, Monitor, Replace, RotateCcw, Square, Wrench } from 'lucide-react';
import { SplitButton, type SplitButtonRadioGroupConfig } from '@/components/UI/SplitButton/SplitButton';
import { getMessage } from '@/utils/i18n';
import type { Session } from '@/types/session';
import { defaultRestoreActionOptions, type DefaultRestoreActionValue } from '@/schemas/enums';

const restoreShortcuts: Record<DefaultRestoreActionValue, string> = {
  current: 'Shift+R',
  new: 'Alt+Shift+R',
  replace: 'Alt+R',
  customize: 'R',
};

export interface SessionRestoreButtonProps {
  session: Session;
  onRestoreCurrentWindow: (session: Session) => void;
  onRestoreNewWindow: (session: Session) => void;
  onReplaceCurrentWindow: (session: Session) => void;
  onCustomize: (session: Session) => void;
  /** Optional: when provided, renders a Refresh icon button to the left of the restore split button. */
  onRefresh?: (session: Session) => void;
  /** Action triggered by the primary button click. Defaults to 'current' for backwards compatibility. */
  defaultRestoreAction?: DefaultRestoreActionValue;
  /** Called when the user picks a new default action from the dropdown radio group. */
  onDefaultRestoreActionChange?: (value: DefaultRestoreActionValue) => void;
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
  defaultRestoreAction = 'current',
  onDefaultRestoreActionChange,
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

  const primaryHandlers: Record<DefaultRestoreActionValue, (s: Session) => void> = {
    current: onRestoreCurrentWindow,
    new: onRestoreNewWindow,
    replace: onReplaceCurrentWindow,
    customize: onCustomize,
  };
  const currentOption = defaultRestoreActionOptions.find((o) => o.value === defaultRestoreAction)
    ?? defaultRestoreActionOptions[0];
  const primaryAriaLabel = getMessage(currentOption.keyLabel);

  const restoreTooltip = (
    <Flex align="center" gap="2">
      {getMessage(currentOption.keyLabel)}
      <Kbd>{restoreShortcuts[defaultRestoreAction]}</Kbd>
    </Flex>
  );

  const radioGroup: SplitButtonRadioGroupConfig | undefined = onDefaultRestoreActionChange
    ? {
        label: getMessage('defaultRestoreActionLabel'),
        value: defaultRestoreAction,
        onValueChange: (v) => onDefaultRestoreActionChange(v as DefaultRestoreActionValue),
        options: defaultRestoreActionOptions.map((option) => ({
          value: option.value,
          label: getMessage(option.keyLabel),
          'data-testid': `session-restore-default-${option.value}`,
        })),
      }
    : undefined;

  const splitButton = (
    <SplitButton
      data-testid={testId}
      label={label}
      primaryAriaLabel={primaryAriaLabel}
      tooltip={restoreTooltip}
      onClick={() => primaryHandlers[defaultRestoreAction](session)}
      size={size}
      variant={variant}
      radioGroup={radioGroup}
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
      <Tooltip
        content={
          <Flex align="center" gap="2">
            {getMessage('sessionRefresh')}
            <Kbd>U</Kbd>
          </Flex>
        }
      >
        <IconButton
          size={size}
          variant={variant}
          color="gray"
          onClick={() => onRefresh(session)}
          aria-label={getMessage('sessionRefresh')}
          aria-keyshortcuts="U"
          data-testid={testId ? `${testId}-refresh` : undefined}
        >
          <Camera size={isTile ? 14 : 12} aria-hidden="true" />
        </IconButton>
      </Tooltip>
      {splitButton}
    </Flex>
  );
}
