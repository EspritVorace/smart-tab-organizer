import { Box, ScrollArea } from '@radix-ui/themes';
import { SidebarItems } from './SidebarItems';
import { SidebarSection } from './Sidebar';

interface SidebarContentProps {
  isCollapsed?: boolean;
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
  onItemPreload?: (itemId: string) => void;
  sections: SidebarSection[];
}

export function SidebarContent({
  isCollapsed = false,
  activeItem,
  onItemClick,
  onItemPreload,
  sections
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
          onItemPreload={onItemPreload}
          sections={sections}
        />
      </Box>
    </ScrollArea>
  );
}
