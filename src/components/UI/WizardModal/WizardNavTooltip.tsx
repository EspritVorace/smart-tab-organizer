import React from 'react';
import { Flex, Kbd, Tooltip } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';

interface WizardNavTooltipProps {
  /** Forward navigation (Ctrl+Enter) or backward navigation (Ctrl+Backspace). */
  kind: 'next' | 'previous';
  /** The navigation button to wrap. */
  children: React.ReactNode;
  /** Hide the tooltip entirely (e.g. while a higher-priority hint is shown). */
  hidden?: boolean;
  /**
   * Override the tooltip body. When provided, the keyboard hint is replaced by
   * this content (e.g. a "no tabs selected" hint that takes precedence).
   */
  content?: React.ReactNode;
}

/**
 * Wraps a wizard navigation button with a tooltip surfacing its keyboard
 * shortcut: Ctrl+Enter advances, Ctrl+Backspace steps back. The combos are
 * literal `Kbd` chips (not translated); only the action label is localized.
 */
export function WizardNavTooltip({ kind, children, hidden, content }: WizardNavTooltipProps) {
  const label = getMessage(
    kind === 'next' ? 'wizardShortcutNextTooltip' : 'wizardShortcutPreviousTooltip',
  );
  // The label stays in the accessibility tree so the tooltip node has an
  // accessible name (axe rule aria-tooltip-name); only the Kbd chips are hidden
  // from assistive tech to avoid reading out "Ctrl Enter" as prose.
  const tooltipContent = content ?? (
    <Flex align="center" gap="2">
      {label}
      <Kbd aria-hidden="true">Ctrl</Kbd>
      <Kbd aria-hidden="true">{kind === 'next' ? 'Enter' : 'Backspace'}</Kbd>
    </Flex>
  );
  return (
    <Tooltip content={tooltipContent} hidden={hidden}>
      {children}
    </Tooltip>
  );
}
