import React from 'react';
import { Box, Flex, Separator } from '@radix-ui/themes';

interface SidebarFooterProps {
  isCollapsed?: boolean;
  children?: React.ReactNode;
  collapsedContent?: React.ReactNode;
}

export function SidebarFooter({
  isCollapsed = false,
  children,
  collapsedContent
}: SidebarFooterProps) {
  const content = isCollapsed ? collapsedContent : children;
  
  if (!content) {
    return null;
  }

  return (
    <>
      <Separator size="4" />
      <Box p="3">
        {content}
      </Box>
    </>
  );
}