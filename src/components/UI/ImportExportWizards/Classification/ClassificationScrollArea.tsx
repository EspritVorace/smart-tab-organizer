import React from 'react';
import { Flex, ScrollArea } from '@radix-ui/themes';

interface ClassificationScrollAreaProps {
  children: React.ReactNode;
}

/**
 * Standard scroll container shared by every import wizard classification
 * step. Keeps the 50vh / gap-3 layout out of the wizard body.
 */
export function ClassificationScrollArea({ children }: ClassificationScrollAreaProps) {
  return (
    <ScrollArea
      type="auto"
      scrollbars="vertical"
      style={{ flex: 1, minHeight: 0, maxHeight: '50vh' }}
    >
      <Flex direction="column" gap="3" pr="3">
        {children}
      </Flex>
    </ScrollArea>
  );
}
