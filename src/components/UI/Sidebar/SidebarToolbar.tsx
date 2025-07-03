import React from 'react';
import { Box } from '@radix-ui/themes';

interface SidebarToolbarProps {
  isCollapsed?: boolean;
  children?: React.ReactNode;
  collapsedContent?: React.ReactNode;
}

export function SidebarToolbar({
  isCollapsed = false,
  children,
  collapsedContent
}: SidebarToolbarProps) {
  const content = isCollapsed ? collapsedContent : children;
  
  if (!content) {
    return null;
  }

  return (
    <Box p="2">
      {content}
    </Box>
  );
}