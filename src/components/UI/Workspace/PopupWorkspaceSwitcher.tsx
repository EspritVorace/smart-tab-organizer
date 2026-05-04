import React from 'react';
import { Flex, Text } from '@radix-ui/themes';
import { ChevronDown } from 'lucide-react';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext.js';
import { getMessage } from '@/utils/i18n.js';
import { WorkspaceAvatar } from '@/components/UI/Workspace/WorkspaceAvatar.js';
import { WorkspaceSwitcherDropdown } from '@/components/UI/Workspace/WorkspaceSwitcherDropdown.js';

interface PopupWorkspaceSwitcherProps {
  /** Open the manage page; the popup typically closes itself afterwards. */
  onManage?: () => void;
}

/**
 * Compact workspace switcher rendered near the top of the popup so the user
 * always sees which workspace their popup actions target. Mirrors the options
 * sidebar footer but adapted for the 400px popup width.
 */
export function PopupWorkspaceSwitcher({ onManage }: PopupWorkspaceSwitcherProps) {
  const { active, accentColor } = useActiveWorkspaceContext();
  const name = active?.name ?? getMessage('workspaceDefaultName');

  const trigger = (
    <Flex
      data-testid="popup-workspace-trigger"
      align="center"
      gap="2"
      style={{
        flex: 1,
        minWidth: 0,
        padding: '6px 8px',
        cursor: 'pointer',
        borderRadius: 'var(--radius-2)',
        border: '1px solid var(--gray-a4)',
        background: 'var(--gray-a2)',
      }}
      role="button"
      tabIndex={0}
      aria-label={getMessage('workspaceSwitcherLabel')}
    >
      <WorkspaceAvatar name={name} accentColor={accentColor} size="sm" />
      <Flex direction="column" gap="0" style={{ flex: 1, minWidth: 0 }}>
        <Text size="1" color="gray" style={{ lineHeight: 1.2 }}>
          {getMessage('popupWorkspaceLabel')}
        </Text>
        <Text
          size="2"
          weight="medium"
          style={{
            color: 'var(--gray-12)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.2,
          }}
        >
          {name}
        </Text>
      </Flex>
      <ChevronDown size={14} style={{ color: 'var(--gray-11)', flexShrink: 0 }} />
    </Flex>
  );

  return (
    <Flex data-testid="popup-workspace-switcher" align="center" style={{ width: '100%' }}>
      <WorkspaceSwitcherDropdown trigger={trigger} onManage={onManage} />
    </Flex>
  );
}
