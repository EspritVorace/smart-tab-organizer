import React from 'react';
import { Flex, Text } from '@radix-ui/themes';
import type { LucideProps } from 'lucide-react';

interface EmptyStateProps {
  icon: React.ComponentType<LucideProps>;
  /** Titre affiché en variante principale. */
  title?: string;
  /** Description affichée en variante principale. */
  description?: string;
  /** Boutons d'action (slot libre). Affiché en variante principale uniquement. */
  actions?: React.ReactNode;
  /** Mode compact : icône + message uniquement, sans titre ni boutons. */
  compact?: boolean;
  /** Message affiché en mode compact (alias de title). */
  message?: string;
  /** Hauteur minimale du conteneur (défaut : 200 en principal, 120 en compact). */
  minHeight?: number | string;
  'data-testid'?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  compact = false,
  message,
  minHeight,
  'data-testid': testId,
}: EmptyStateProps) {
  const iconSize = compact ? 32 : 40;
  const defaultMinHeight = compact ? 120 : 200;

  return (
    <Flex
      data-testid={testId}
      direction="column"
      align="center"
      justify="center"
      gap={compact ? '2' : '3'}
      style={{ minHeight: minHeight ?? defaultMinHeight }}
    >
      <Icon size={iconSize} style={{ color: 'var(--gray-8)' }} aria-hidden="true" />
      {compact ? (
        <Text color="gray">{message ?? title}</Text>
      ) : (
        <>
          {title && (
            <Text size="3" weight="medium" color="gray" align="center">
              {title}
            </Text>
          )}
          {description && (
            <Text size="2" color="gray" align="center" style={{ maxWidth: 340 }}>
              {description}
            </Text>
          )}
          {actions}
        </>
      )}
    </Flex>
  );
}
