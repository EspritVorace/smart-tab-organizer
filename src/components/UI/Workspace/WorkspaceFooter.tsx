import { Flex } from '@radix-ui/themes';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext.js';
import { getMessage } from '@/utils/i18n.js';
import { WorkspaceSwitcherDropdown } from './WorkspaceSwitcherDropdown.js';
import { WorkspaceTrigger } from './WorkspaceTrigger';
import { WorkspaceAvatar } from './WorkspaceAvatar.js';

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

  return (
    <Flex
      data-testid="workspace-footer"
      align="center"
      style={{ width: '100%', padding: '4px 6px' }}
    >
      <WorkspaceSwitcherDropdown
        trigger={
          <WorkspaceTrigger
            name={name}
            accentColor={accentColor}
            variant="sidebar"
            testId="workspace-footer-trigger"
          />
        }
        onManage={onManage}
      />
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
