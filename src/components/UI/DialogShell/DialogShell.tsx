import React from 'react';
import { Dialog, Flex, IconButton, Separator } from '@radix-ui/themes';
import { X, type LucideIcon } from 'lucide-react';
import { getMessage } from '@/utils/i18n';

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

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        data-testid={dataTestId}
        style={mergedStyle}
        onInteractOutside={resolvedInteractOutside}
        onPointerDownOutside={resolvedPointerDownOutside}
        onEscapeKeyDown={onEscapeKeyDown}
        onOpenAutoFocus={onOpenAutoFocus}
      >
        <div style={{ flexShrink: 0 }}>
          <Dialog.Title>
            <Flex align="center" gap="2">
              {Icon && <Icon size={18} aria-hidden="true" />}
              {title}
            </Flex>
          </Dialog.Title>
          {description !== undefined && (
            <Dialog.Description
              size="2"
              color="gray"
              style={hideDescription ? { display: 'none' } : undefined}
            >
              {description}
            </Dialog.Description>
          )}
          {showHeaderSeparator && <Separator size="4" mt="3" style={{ opacity: 0.3 }} />}
        </div>

        <Dialog.Close>
          <IconButton
            size="1"
            variant="ghost"
            color="gray"
            aria-label={getMessage('close')}
            title={getMessage('close')}
            style={closeButtonStyle}
          >
            <X size={16} aria-hidden="true" />
          </IconButton>
        </Dialog.Close>

        {children}
      </Dialog.Content>
    </Dialog.Root>
  );
}
