import React from 'react';
import { Flex, Button, Separator } from '@radix-ui/themes';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { getMessage } from '@/utils/i18n';

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
      gap="2"
      style={{
        borderBottom: '1px solid var(--gray-6)',
        paddingLeft: 'var(--space-3)',
        paddingRight: 'var(--space-2)',
        paddingTop: 'var(--space-3)',
        paddingBottom: 'var(--space-3)',
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
          <Flex style={{ flex: 1, minWidth: 0 }}>
            {children}
          </Flex>
        )
      )}

      {onToggleCollapse && (
        <>
          <Separator orientation="vertical" size="2" />
          <Button
            data-testid="sidebar-collapse-btn"
            variant="ghost"
            size="1"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? getMessage('sidebarExpand') : getMessage('sidebarCollapse')}
            title={isCollapsed ? getMessage('sidebarExpand') : getMessage('sidebarCollapse')}
            style={{ color: 'var(--gray-11)', margin: 0, padding: 'var(--space-1) var(--space-2)' }}
          >
            {isCollapsed ? <PanelLeftOpen size={16} aria-hidden="true" /> : <PanelLeftClose size={16} aria-hidden="true" />}
          </Button>
        </>
      )}
    </Flex>
  );
}