import React from 'react';
import { Flex } from '@radix-ui/themes';

interface SelectableRowShellProps {
  /** Reduces opacity for rows that are displayed but not actionable. */
  dimmed?: boolean;
  children: React.ReactNode;
}

/**
 * Shared "gray pill" row wrapper used by every selectable rule/session row
 * across import and export steps. Keeps the padding, radius and dimmed
 * treatment in a single place.
 */
export function SelectableRowShell({ dimmed = false, children }: SelectableRowShellProps) {
  return (
    <Flex
      align="center"
      gap="3"
      p="2"
      style={{
        borderRadius: 'var(--radius-2)',
        backgroundColor: 'var(--gray-a2)',
        opacity: dimmed ? 0.6 : 1,
      }}
    >
      {children}
    </Flex>
  );
}
