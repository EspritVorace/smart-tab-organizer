import React from 'react';
import { Flex } from '@radix-ui/themes';
import { AlertTriangle } from 'lucide-react';

interface ConflictRowShellProps {
  children: React.ReactNode;
}

/**
 * Shared "orange alert" row used by ConflictRuleRow and ConflictSessionRow.
 * Renders the padded Flex wrapper with the AlertTriangle icon; callers
 * place their own metadata + actions as children.
 */
export function ConflictRowShell({ children }: ConflictRowShellProps) {
  return (
    <Flex
      align="center"
      gap="3"
      p="2"
      style={{
        borderRadius: 'var(--radius-2)',
        backgroundColor: 'var(--orange-a2)',
      }}
    >
      <AlertTriangle
        size={16}
        style={{ color: 'var(--orange-9)', flexShrink: 0 }}
        aria-hidden="true"
      />
      {children}
    </Flex>
  );
}
