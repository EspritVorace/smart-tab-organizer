import React from 'react';
import { Dialog, Flex, Separator } from '@radix-ui/themes';
import { type LucideIcon } from 'lucide-react';
import { IconBox } from '@/components/UI/IconBox/IconBox';
import { DialogCloseButton } from './DialogCloseButton';

type DialogContentProps = React.ComponentProps<typeof Dialog.Content>;

interface DialogShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  icon?: LucideIcon;
  description?: string;
  /** When true, render description for screen readers only. */
  hideDescription?: boolean;
  children: React.ReactNode;

  maxWidth?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;
  /** Extra styles merged into Dialog.Content. Sizing props above take precedence. */
  contentStyle?: React.CSSProperties;

  /** Blocks outside click and pointer-down-outside from closing the dialog. */
  preventOutsideClose?: boolean;
  onInteractOutside?: DialogContentProps['onInteractOutside'];
  onEscapeKeyDown?: DialogContentProps['onEscapeKeyDown'];
  onPointerDownOutside?: DialogContentProps['onPointerDownOutside'];
  onOpenAutoFocus?: DialogContentProps['onOpenAutoFocus'];
  /** Forwarded to Dialog.Content (composed with Radix's internal handlers). */
  onKeyDown?: DialogContentProps['onKeyDown'];

  /** Render a separator below the header. Default true. */
  showHeaderSeparator?: boolean;
  'data-testid'?: string;
}

const closeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
};

/**
 * Radix's default focuses the first focusable element, which in our shell is
 * the close X button: pressing Enter then dismisses the dialog instead of
 * triggering the primary action.
 *
 * Priority order (WAI-ARIA APG Modal Dialog Pattern):
 * 1. Element marked [data-autofocus] and not disabled -> focus it.
 * 2. Disabled [data-autofocus] -> fall through to title.
 * 3. No [data-autofocus] -> focus the dialog title ([data-dialog-title]).
 *
 * The title receives tabIndex={-1} so it is programmatically focusable but
 * stays out of the Tab order. Screen readers announce it on open, which is
 * the expected WAI-ARIA behaviour for informational dialogs.
 */
function defaultOnOpenAutoFocus(event: Event) {
  const root = event.currentTarget;
  if (!(root instanceof HTMLElement)) return;
  const target = root.querySelector<HTMLElement>('[data-autofocus]');
  if (target) {
    const isDisabled =
      (target instanceof HTMLButtonElement && target.disabled) ||
      target.getAttribute('aria-disabled') === 'true';
    if (!isDisabled) {
      event.preventDefault();
      target.focus();
      return;
    }
  }
  // Fallback: focus the dialog title so the close button is never the initial target.
  const titleEl = root.querySelector<HTMLElement>('[data-dialog-title]');
  if (titleEl) {
    event.preventDefault();
    titleEl.focus();
  }
}

export function DialogShell({
  open,
  onOpenChange,
  title,
  icon: Icon,
  description,
  hideDescription = false,
  children,
  maxWidth,
  minHeight,
  maxHeight,
  contentStyle,
  preventOutsideClose = false,
  onInteractOutside,
  onEscapeKeyDown,
  onPointerDownOutside,
  onOpenAutoFocus,
  onKeyDown,
  showHeaderSeparator = true,
  'data-testid': dataTestId,
}: DialogShellProps) {
  const mergedStyle: React.CSSProperties = {
    ...contentStyle,
    ...(maxWidth !== undefined ? { maxWidth } : null),
    ...(minHeight !== undefined ? { minHeight } : null),
    ...(maxHeight !== undefined ? { maxHeight } : null),
  };

  const resolvedInteractOutside =
    onInteractOutside ?? (preventOutsideClose ? (event) => event.preventDefault() : undefined);
  const resolvedPointerDownOutside =
    onPointerDownOutside ?? (preventOutsideClose ? (event) => event.preventDefault() : undefined);
  const resolvedOnOpenAutoFocus = onOpenAutoFocus ?? defaultOnOpenAutoFocus;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        data-testid={dataTestId}
        style={mergedStyle}
        onInteractOutside={resolvedInteractOutside}
        onPointerDownOutside={resolvedPointerDownOutside}
        onEscapeKeyDown={onEscapeKeyDown}
        onOpenAutoFocus={resolvedOnOpenAutoFocus}
        onKeyDown={onKeyDown}
      >
        <div style={{ flexShrink: 0 }}>
          <Dialog.Title tabIndex={-1} data-dialog-title style={{ outline: 'none' }}>
            <Flex align="center" gap="2">
              {Icon && <IconBox icon={Icon} size="sm" variant="gradient" />}
              {title}
            </Flex>
          </Dialog.Title>
          {description !== undefined && (
            <Dialog.Description
              size="2"
              color="gray"
              highContrast
              style={hideDescription ? { display: 'none' } : undefined}
            >
              {description}
            </Dialog.Description>
          )}
          {showHeaderSeparator && <Separator size="4" mt="3" style={{ opacity: 0.3 }} />}
        </div>

        <DialogCloseButton style={closeButtonStyle} />

        {children}
      </Dialog.Content>
    </Dialog.Root>
  );
}
