import React from 'react';
import { Flex, ScrollArea } from '@radix-ui/themes';

interface SelectableListContainerProps {
  children: React.ReactNode;
}

/**
 * Shared scroll container for the export selection list (rules, sessions).
 * Matches the 40vh / vertical-scroll layout used by every export wizard.
 */
export function SelectableListContainer({ children }: SelectableListContainerProps) {
  return (
    <ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: '40vh' }}>
      <Flex direction="column" gap="2" pr="3">
        {children}
      </Flex>
    </ScrollArea>
  );
}
