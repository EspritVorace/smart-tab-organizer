import React from 'react';
import { Box, ScrollArea } from '@radix-ui/themes';
import { SidebarItems } from './SidebarItems';
import { SidebarItem } from './Sidebar';

interface SidebarContentProps {
  isCollapsed?: boolean;
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
  items: SidebarItem[];
}

export function SidebarContent({
  isCollapsed = false,
  activeItem,
  onItemClick,
  items
}: SidebarContentProps) {
  return (
    <ScrollArea 
      type="auto" 
      scrollbars="vertical" 
      style={{ flex: 1, overflowX: 'hidden' }}
    >
      <Box p="2">
        <SidebarItems
          isCollapsed={isCollapsed}
          activeItem={activeItem}
          onItemClick={onItemClick}
          items={items}
        />
      </Box>
    </ScrollArea>
  );
}