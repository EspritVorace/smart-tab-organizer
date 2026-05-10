import React from 'react';
import { Flex, Text } from '@radix-ui/themes';
import type { LucideProps } from 'lucide-react';

interface EmptyStateProps {
  icon: React.ComponentType<LucideProps>;
  /** Title shown in the primary variant. */
  title?: string;
  /** Description shown in the primary variant. */
  description?: string;
  /** Action buttons (free slot). Rendered in the primary variant only. */
  actions?: React.ReactNode;
  /** Compact mode: icon plus message only, no title or buttons. */
  compact?: boolean;
  /** Message shown in compact mode (alias of title). */
  message?: string;
  /** Max width of the description (default: 340). Pass `undefined` to drop the constraint. */
  descriptionMaxWidth?: number | 'none';
  /** Minimum container height (default: 200 primary, 120 compact). */
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
  descriptionMaxWidth = 340,
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
            <Text size="2" color="gray" align="center" style={descriptionMaxWidth !== 'none' ? { maxWidth: descriptionMaxWidth } : undefined}>
              {description}
            </Text>
          )}
          {actions}
        </>
      )}
    </Flex>
  );
}
