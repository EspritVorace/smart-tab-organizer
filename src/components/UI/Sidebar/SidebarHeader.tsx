import React from 'react';
import { Flex, Button, Separator } from '@radix-ui/themes';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface SidebarHeaderProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  children?: React.ReactNode;
  collapsedContent?: React.ReactNode;
}

export function SidebarHeader({
  isCollapsed = false,
  onToggleCollapse,
  children,
  collapsedContent
}: SidebarHeaderProps) {
  return (
    <Flex
      align="center"
      style={{ 
        borderBottom: '1px solid var(--gray-6)',
        paddingLeft: 'var(--space-3)',
        paddingRight: 0,
        paddingTop: 'var(--space-3)',
        paddingBottom: 'var(--space-3)',
        position: 'relative'
      }}
    >
      {isCollapsed ? (
        collapsedContent && (
          <Flex style={{ flex: 1 }}>
            {collapsedContent}
          </Flex>
        )
      ) : (
        children && (
          <Flex style={{ flex: 1 }}>
            {children}
          </Flex>
        )
      )}
      
      {onToggleCollapse && (
        <>
          <Separator 
            orientation="vertical" 
            size="4" 
            style={{ 
              position: 'absolute',
              right: '32px',
              top: 0,
              bottom: 0,
              height: '100%',
              marginLeft: 'auto'
            }} 
          />
          <Button
            variant="ghost"
            size="1"
            onClick={onToggleCollapse}
            style={{ marginLeft: 'auto', marginRight: 0, color: 'var(--gray-11)' }}
          >
            {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </Button>
        </>
      )}
    </Flex>
  );
}