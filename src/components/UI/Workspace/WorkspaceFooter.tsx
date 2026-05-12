import React from 'react';
import { Flex, IconButton, Text } from '@radix-ui/themes';
import { ChevronDown, Settings2 } from 'lucide-react';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext.js';
import { getMessage } from '@/utils/i18n.js';
import { WorkspaceAvatar } from './WorkspaceAvatar.js';
import { WorkspaceSwitcherDropdown } from './WorkspaceSwitcherDropdown.js';

interface WorkspaceFooterProps {
  /** Lot 4 wires the manage page; left undefined in Lot 3 (button disabled). */
  onManage?: () => void;
}

function useWorkspaceName() {
  const { active, accentColor } = useActiveWorkspaceContext();
  const name = active?.name ?? getMessage('workspaceDefaultName');
  return { name, accentColor };
}

/**
 * Sidebar footer that surfaces the active workspace and exposes the workspace
 * switcher. Replaces the static EspritVorace/GitHub footer.
 */
export function WorkspaceFooter({ onManage }: WorkspaceFooterProps) {
  const { name, accentColor } = useWorkspaceName();

  const trigger = (
    <Flex
      data-testid="workspace-footer-trigger"
      align="center"
      gap="3"
      style={{
        flex: 1,
        minWidth: 0,
        padding: '8px 10px',
        cursor: 'pointer',
        borderRadius: 'var(--radius-2)',
        background: 'transparent',
        transition: 'background-color 0.15s ease',
      }}
      role="button"
      tabIndex={0}
      aria-label={getMessage('workspaceSwitcherLabel')}
    >
      <WorkspaceAvatar name={name} accentColor={accentColor} size="sm" />
      <Text size="2" weight="medium" style={{ color: 'var(--gray-12)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </Text>
      <ChevronDown size={14} style={{ color: 'var(--gray-11)', flexShrink: 0 }} />
    </Flex>
  );

  return (
    <Flex
      data-testid="workspace-footer"
      align="center"
      gap="2"
      style={{ width: '100%', padding: '4px 6px' }}
    >
      <WorkspaceSwitcherDropdown trigger={trigger} onManage={onManage} />
      <IconButton
        data-testid="workspace-manage-button"
        variant="ghost"
        size="2"
        disabled={!onManage}
        aria-label={getMessage('workspaceManageLabel')}
        title={getMessage('workspaceManageLabel')}
        onClick={onManage}
      >
        <Settings2 size={16} />
      </IconButton>
    </Flex>
  );
}

/** Collapsed sidebar footer: avatar only acting as the dropdown trigger. */
export function WorkspaceFooterCollapsed({ onManage }: WorkspaceFooterProps) {
  const { name, accentColor } = useWorkspaceName();

  const trigger = (
    <Flex
      data-testid="workspace-footer-trigger-collapsed"
      align="center"
      justify="center"
      style={{
        padding: '8px',
        cursor: 'pointer',
        borderRadius: 'var(--radius-2)',
      }}
      role="button"
      tabIndex={0}
      aria-label={getMessage('workspaceSwitcherLabel')}
      title={name}
    >
      <WorkspaceAvatar name={name} accentColor={accentColor} size="sm" ariaLabel={name} />
    </Flex>
  );

  return <WorkspaceSwitcherDropdown trigger={trigger} onManage={onManage} />;
}
