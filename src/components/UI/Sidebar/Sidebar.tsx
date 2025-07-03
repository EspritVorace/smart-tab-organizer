import React from 'react';
import { Box, Flex } from '@radix-ui/themes';
import { SidebarHeader } from './SidebarHeader';
import { SidebarToolbar } from './SidebarToolbar';
import { SidebarSearch } from './SidebarSearch';
import { SidebarContent } from './SidebarContent';
import { SidebarFooter } from './SidebarFooter';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  accentColor?: string;
}

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
  items: SidebarItem[];
  showFooter?: boolean;
  footerContent?: React.ReactNode;
  footerCollapsedContent?: React.ReactNode;
  headerContent?: React.ReactNode;
  headerCollapsedContent?: React.ReactNode;
  showToolbar?: boolean;
  toolbarContent?: React.ReactNode;
  toolbarCollapsedContent?: React.ReactNode;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  onSearch?: (query: string) => void;
}

export function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
  activeItem,
  onItemClick,
  items,
  showFooter = false,
  footerContent,
  footerCollapsedContent,
  headerContent,
  headerCollapsedContent,
  showToolbar = false,
  toolbarContent,
  toolbarCollapsedContent,
  showSearch = false,
  searchPlaceholder,
  searchValue,
  onSearchValueChange,
  onSearch
}: SidebarProps) {
  return (
    <Box
      style={{
        height: '100vh',
        width: isCollapsed ? '80px' : '280px',
        transition: 'width 0.2s ease-in-out',
        borderRight: '1px solid var(--gray-6)',
        backgroundColor: 'var(--color-panel-solid)',
        margin: 0,
        padding: 0
      }}
    >
      <Flex direction="column" height="100%">
        <SidebarHeader 
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          collapsedContent={headerCollapsedContent}
        >
          {headerContent}
        </SidebarHeader>
        
        {showToolbar && (
          <SidebarToolbar
            isCollapsed={isCollapsed}
            collapsedContent={toolbarCollapsedContent}
          >
            {toolbarContent}
          </SidebarToolbar>
        )}
        
        {showSearch && (
          <SidebarSearch
            isCollapsed={isCollapsed}
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={onSearchValueChange}
            onSearch={onSearch}
          />
        )}
        
        <SidebarContent
          isCollapsed={isCollapsed}
          activeItem={activeItem}
          onItemClick={onItemClick}
          items={items}
        />
        
        {showFooter && (
          <SidebarFooter 
            isCollapsed={isCollapsed}
            collapsedContent={footerCollapsedContent}
          >
            {footerContent}
          </SidebarFooter>
        )}
      </Flex>
    </Box>
  );
}