import React, { useState } from 'react';
import { DropdownMenu, Flex, Text } from '@radix-ui/themes';
import { Check, Info, Settings2 } from 'lucide-react';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext.js';
import { getMessage } from '@/utils/i18n.js';
import { AboutDialog } from '@/components/UI/AboutDialog';
import { WorkspaceAvatar } from './WorkspaceAvatar.js';

interface WorkspaceSwitcherDropdownProps {
  trigger: React.ReactNode;
  /** Lot 4 will wire this to the WorkspacesPage; disabled in Lot 3. */
  onManage?: () => void;
}

/**
 * Dropdown menu listing all workspaces. Selecting one persists the new
 * activeWorkspaceId; the Provider then re-emits the context and consumers
 * remount via key={activeId}.
 */
export function WorkspaceSwitcherDropdown({ trigger, onManage }: WorkspaceSwitcherDropdownProps) {
  const { workspaces, activeId, switchTo } = useActiveWorkspaceContext();
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {trigger}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          data-testid="workspace-switcher-content"
          aria-label={getMessage('workspaceSwitcherLabel')}
        >
          <DropdownMenu.Label>
            {getMessage('workspaceSwitcherLabel')}
          </DropdownMenu.Label>
          {workspaces.map((ws) => {
            const isActive = ws.id === activeId;
            return (
              <DropdownMenu.Item
                key={ws.id}
                data-testid={`workspace-switcher-item-${ws.id}`}
                onSelect={() => {
                  if (!isActive) void switchTo(ws.id);
                }}
              >
                <Flex align="center" gap="2" style={{ width: '100%' }}>
                  <WorkspaceAvatar name={ws.name} accentColor={ws.accentColor} size="sm" />
                  <Text size="2" style={{ flex: 1 }}>{ws.name}</Text>
                  {isActive ? <Check size={14} /> : null}
                </Flex>
              </DropdownMenu.Item>
            );
          })}
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            disabled={!onManage}
            data-testid="workspace-switcher-manage"
            onSelect={() => {
              if (onManage) onManage();
            }}
          >
            <Flex align="center" gap="2">
              <Settings2 size={14} aria-hidden="true" />
              <Text size="2">{getMessage('workspaceManageLabel')}</Text>
            </Flex>
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            data-testid="workspace-switcher-about"
            onSelect={() => setAboutOpen(true)}
          >
            <Flex align="center" gap="2">
              <Info size={14} aria-hidden="true" />
              <Text size="2">{getMessage('aboutDialogMenuItem')}</Text>
            </Flex>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </>
  );
}
