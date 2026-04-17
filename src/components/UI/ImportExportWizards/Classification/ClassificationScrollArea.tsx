import React from 'react';
import { Flex } from '@radix-ui/themes';

interface ClassificationScrollAreaProps {
  children: React.ReactNode;
}

export function ClassificationScrollArea({ children }: ClassificationScrollAreaProps) {
  return (
    <Flex direction="column" gap="3">
      {children}
    </Flex>
  );
}
