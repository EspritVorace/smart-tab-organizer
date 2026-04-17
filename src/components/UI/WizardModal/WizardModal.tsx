import React from 'react';
import { Dialog, Flex, Separator } from '@radix-ui/themes';
import type { LucideIcon } from 'lucide-react';

interface WizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  'data-testid'?: string;
  /** Forwarded to Dialog.Content (e.g. to pre-focus an input on open). */
  onOpenAutoFocus?: (event: Event) => void;
}

const contentStyle: React.CSSProperties = {
  maxWidth: 600,
  minHeight: 'min(480px, 80vh)',
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  paddingBottom: 'var(--space-3)',
};

function WizardModalRoot({
  open,
  onOpenChange,
  children,
  'data-testid': dataTestId,
  onOpenAutoFocus,
}: WizardModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        data-testid={dataTestId}
        style={contentStyle}
        onOpenAutoFocus={onOpenAutoFocus}
      >
        {children}
      </Dialog.Content>
    </Dialog.Root>
  );
}

interface HeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** When provided, the description is rendered but visually hidden (accessibility only). */
  hideDescription?: boolean;
}

function Header({ icon: Icon, title, description, hideDescription = false }: HeaderProps) {
  return (
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
      <Separator size="4" mt="3" style={{ opacity: 0.3 }} />
    </div>
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
  Header,
  Body,
  Footer,
});
