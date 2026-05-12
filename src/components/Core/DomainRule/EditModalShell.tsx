import type { ReactNode } from 'react';
import type React from 'react';
import { DialogShell } from '@/components/UI/DialogShell';
import { EditModalFooter } from './EditModalFooter';

interface EditModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  disabled: boolean;
  title: string;
  maxWidth?: number | string;
  applyTestId?: string;
  'data-testid'?: string;
  children: ReactNode;
  contentStyle?: React.CSSProperties;
}

export function EditModalShell({
  isOpen,
  onClose,
  onApply,
  disabled,
  title,
  maxWidth,
  applyTestId,
  'data-testid': dataTestId,
  children,
  contentStyle,
}: EditModalShellProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <DialogShell
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={title}
      description={title}
      hideDescription
      maxWidth={maxWidth}
      showHeaderSeparator={false}
      data-testid={dataTestId}
      contentStyle={contentStyle}
    >
      {children}

      <EditModalFooter onClose={onClose} onApply={onApply} disabled={disabled} applyTestId={applyTestId} />
    </DialogShell>
  );
}
