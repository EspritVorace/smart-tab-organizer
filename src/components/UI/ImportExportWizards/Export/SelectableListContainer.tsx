import React from 'react';
import { Flex } from '@radix-ui/themes';

interface SelectableListContainerProps {
  children: React.ReactNode;
}

export function SelectableListContainer({ children }: SelectableListContainerProps) {
  return (
    <Flex direction="column" gap="2" role="list">
      {children}
    </Flex>
  );
}
