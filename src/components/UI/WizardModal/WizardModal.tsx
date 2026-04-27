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
  children: React.ReactNode;
  'data-testid'?: string;
  /** Forwarded to Dialog.Content (e.g. to pre-focus an input on open). */
  onOpenAutoFocus?: React.ComponentProps<typeof DialogShell>['onOpenAutoFocus'];
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
  children,
  'data-testid': dataTestId,
  onOpenAutoFocus,
}: WizardModalProps) {
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
      preventOutsideClose
      maxWidth={600}
      minHeight="min(480px, 80vh)"
      maxHeight="80vh"
      contentStyle={wizardContentStyle}
    >
      {children}
    </DialogShell>
  );
}

interface BodyProps {
  children: React.ReactNode;
}

function Body({ children }: BodyProps) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
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
