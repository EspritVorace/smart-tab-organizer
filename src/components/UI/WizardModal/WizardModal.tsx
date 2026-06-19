import React from 'react';
import { Flex, Separator } from '@radix-ui/themes';
import type { LucideIcon } from 'lucide-react';
import { DialogShell } from '@/components/UI/DialogShell';

interface WizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  icon?: LucideIcon;
  description?: string;
  /** When true, render description for screen readers only. */
  hideDescription?: boolean;
  /** Override the dialog max width (default 600). */
  maxWidth?: number | string;
  /**
   * When true, force the dialog to a fixed height (80vh) so inner flex chains
   * (e.g. an inline scrollable list) can size deterministically. Default: false.
   */
  fillHeight?: boolean;
  children: React.ReactNode;
  'data-testid'?: string;
  /** Forwarded to Dialog.Content (e.g. to pre-focus an input on open). */
  onOpenAutoFocus?: React.ComponentProps<typeof DialogShell>['onOpenAutoFocus'];
  /**
   * Wired to Ctrl/Cmd+Enter. Advances the wizard (or triggers the final
   * confirm action on the last step). Leave undefined when the forward
   * button is absent or disabled, which makes the shortcut inert.
   */
  onNext?: () => void;
  /**
   * Wired to Ctrl/Cmd+Backspace. Steps back. Leave undefined when there is
   * no previous step, which makes the shortcut inert.
   */
  onPrevious?: () => void;
}

const wizardContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  paddingBottom: 'var(--space-3)',
};

function WizardModalRoot({
  open,
  onOpenChange,
  title,
  icon,
  description,
  hideDescription,
  maxWidth = 600,
  fillHeight = false,
  children,
  'data-testid': dataTestId,
  onOpenAutoFocus,
  onNext,
  onPrevious,
}: WizardModalProps) {
  const contentStyle: React.CSSProperties = fillHeight
    ? { ...wizardContentStyle, height: '80vh' }
    : wizardContentStyle;
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.defaultPrevented) return;
    // Mirror the project's `Mod` convention: Ctrl on Win/Linux, Cmd on Mac.
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.key === 'Enter' && onNext) {
      event.preventDefault();
      onNext();
    } else if (event.key === 'Backspace' && onPrevious) {
      event.preventDefault();
      onPrevious();
    }
  };
  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      icon={icon}
      description={description}
      hideDescription={hideDescription}
      data-testid={dataTestId}
      onOpenAutoFocus={onOpenAutoFocus}
      onKeyDown={handleKeyDown}
      preventOutsideClose
      maxWidth={maxWidth}
      minHeight={fillHeight ? undefined : 'min(520px, 85vh)'}
      maxHeight={fillHeight ? undefined : '85vh'}
      contentStyle={contentStyle}
    >
      {children}
    </DialogShell>
  );
}

interface BodyProps {
  children: React.ReactNode;
  /**
   * When true, body becomes a flex column with overflow hidden so inner content
   * (e.g. an inline cmdk palette) can fill the available height via flex chain.
   * Default: false (body scrolls naturally when content overflows).
   */
  fillHeight?: boolean;
}

function Body({ children, fillHeight = false }: BodyProps) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: fillHeight ? 'hidden' : 'auto',
        display: fillHeight ? 'flex' : undefined,
        flexDirection: fillHeight ? 'column' : undefined,
        paddingRight: 12,
        paddingTop: 'var(--space-4)',
      }}
    >
      {children}
    </div>
  );
}

interface FooterProps {
  children: React.ReactNode;
}

function Footer({ children }: FooterProps) {
  return (
    <div style={{ flexShrink: 0 }}>
      <Separator size="4" mt="3" style={{ opacity: 0.3 }} />
      <Flex gap="3" justify="end" mt="3">
        {children}
      </Flex>
    </div>
  );
}

export const WizardModal = Object.assign(WizardModalRoot, {
  Body,
  Footer,
});
