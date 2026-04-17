import React from 'react';
import { Dialog } from '@radix-ui/themes';

interface WizardDialogContentProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

const baseStyle: React.CSSProperties = {
  maxWidth: 600,
  minHeight: 'min(480px, 80vh)',
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
};

export function WizardDialogContent({
  children,
  style,
  'data-testid': dataTestId,
}: WizardDialogContentProps) {
  return (
    <Dialog.Content data-testid={dataTestId} style={{ ...baseStyle, ...style }}>
      {children}
    </Dialog.Content>
  );
}
