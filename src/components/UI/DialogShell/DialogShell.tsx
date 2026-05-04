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
 * triggering the primary action. When a child marks an element with the
 * `data-autofocus` attribute (typically the primary action button), focus it
 * instead. Disabled elements fall through to Radix's default so we never park
 * focus on something that swallows Enter.
 */
function defaultOnOpenAutoFocus(event: Event) {
  const root = event.currentTarget;
  if (!(root instanceof HTMLElement)) return;
  const target = root.querySelector<HTMLElement>('[data-autofocus]');
  if (!target) return;
  if (target instanceof HTMLButtonElement && target.disabled) return;
  if (target.getAttribute('aria-disabled') === 'true') return;
  event.preventDefault();
  target.focus();
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
      >
        <div style={{ flexShrink: 0 }}>
          <Dialog.Title>
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
