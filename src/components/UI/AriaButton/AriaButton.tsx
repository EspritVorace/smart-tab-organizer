import React from 'react';
import { Button, Tooltip } from '@radix-ui/themes';
import type { ButtonProps } from '@radix-ui/themes';

export interface AriaButtonProps extends Omit<ButtonProps, 'disabled'> {
  /** When true, uses aria-disabled instead of native disabled (keeps element in tab order). */
  ariaDisabled?: boolean;
  /** Explanation shown in a Radix Tooltip when ariaDisabled is true. */
  disabledReason?: string;
  onClick?: () => void;
}

/**
 * Radix Button wrapper that implements the aria-disabled pattern:
 * the button stays focusable, its onClick is short-circuited in JS,
 * and an optional Tooltip surfaces the reason to keyboard/SR users.
 */
export function AriaButton({
  ariaDisabled,
  disabledReason,
  onClick,
  children,
  ...props
}: AriaButtonProps) {
  const button = (
    <Button
      {...props}
      aria-disabled={ariaDisabled || undefined}
      onClick={ariaDisabled ? undefined : onClick}
    >
      {children}
    </Button>
  );

  if (ariaDisabled && disabledReason) {
    return <Tooltip content={disabledReason}>{button}</Tooltip>;
  }

  return button;
}
