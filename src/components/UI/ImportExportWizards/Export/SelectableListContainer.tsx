import React from 'react';
import { Flex } from '@radix-ui/themes';

interface SelectableListContainerProps {
  children: React.ReactNode;
  /** Pass role="list" when direct children are listitem elements (e.g. DomainRuleCard). */
  role?: string;
}

export function SelectableListContainer({ children, role }: SelectableListContainerProps) {
  return (
    <Flex direction="column" gap="2" role={role}>
      {children}
    </Flex>
  );
}
