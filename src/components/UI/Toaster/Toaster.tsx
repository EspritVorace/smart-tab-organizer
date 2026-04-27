import { useCallback, useEffect, useState } from 'react';
import * as Toast from '@radix-ui/react-toast';
import { Box, Flex, IconButton, Text } from '@radix-ui/themes';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

import { getMessage } from '@/utils/i18n';
import { subscribeToToasts, type ToastPayload, type ToastVariant } from '@/utils/toast';
import './Toaster.css';

const TOAST_DURATION_MS = 6000;

interface ActiveToast extends ToastPayload {
  open: boolean;
}

const VARIANT_ACCENT: Record<ToastVariant, 'green' | 'red' | 'gray'> = {
  success: 'green',
  error: 'red',
  info: 'gray',
};

function VariantIcon({ variant }: { variant: ToastVariant }) {
  const color = `var(--${VARIANT_ACCENT[variant]}-11)`;
  const commonProps = { size: 18, color, 'aria-hidden': true } as const;
  if (variant === 'success') return <CheckCircle2 {...commonProps} />;
  if (variant === 'error') return <AlertCircle {...commonProps} />;
  return <Info {...commonProps} />;
}

export function Toaster() {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((payload) => {
      setToasts((prev) => [...prev, { ...payload, open: true }]);
    });
    return unsubscribe;
  }, []);

  const handleOpenChange = useCallback((id: string, open: boolean) => {
    if (open) return;
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, open: false } : t)));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  return (
    <Toast.Provider swipeDirection="right" duration={TOAST_DURATION_MS} label={getMessage('toastViewportLabel')}>
      {toasts.map((toast) => {
        const accent = VARIANT_ACCENT[toast.variant];
        return (
          <Toast.Root
            key={toast.id}
            open={toast.open}
            onOpenChange={(open) => handleOpenChange(toast.id, open)}
            duration={TOAST_DURATION_MS}
            className="sto-toast-root"
            data-variant={toast.variant}
            data-testid={`toast-${toast.variant}`}
          >
            <Flex gap="3" align="start" p="3">
              <Box pt="1">
                <VariantIcon variant={toast.variant} />
              </Box>
              <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
                <Toast.Title asChild>
                  <Text as="div" weight="bold" size="2" style={{ color: `var(--${accent}-12)` }}>
                    {toast.title}
                  </Text>
                </Toast.Title>
                <Toast.Description asChild>
                  <Text as="div" size="2" color="gray" highContrast>
                    {toast.message}
                  </Text>
                </Toast.Description>
              </Flex>
              <Toast.Close asChild>
                <IconButton
                  size="1"
                  variant="ghost"
                  color="gray"
                  aria-label={getMessage('toastCloseLabel')}
                  title={getMessage('toastCloseLabel')}
                  data-testid="toast-btn-close"
                >
                  <X size={14} aria-hidden="true" />
                </IconButton>
              </Toast.Close>
            </Flex>
          </Toast.Root>
        );
      })}
      <Toast.Viewport className="sto-toast-viewport" data-testid="toast-viewport" />
    </Toast.Provider>
  );
}
