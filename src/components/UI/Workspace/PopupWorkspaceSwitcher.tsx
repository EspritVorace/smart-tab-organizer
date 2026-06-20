import { Flex } from '@radix-ui/themes';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext.js';
import { getMessage } from '@/utils/i18n.js';
import { WorkspaceSwitcherDropdown } from '@/components/UI/Workspace/WorkspaceSwitcherDropdown.js';
import { WorkspaceTrigger } from './WorkspaceTrigger';

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
  const { active, accentColor, workspaces, isLoaded } = useActiveWorkspaceContext();

  if (!isLoaded || workspaces.length <= 1) {
    return null;
  }

  const name = active?.name ?? getMessage('workspaceDefaultName');

  return (
    <Flex data-testid="popup-workspace-switcher" align="center" style={{ width: '100%' }}>
      <WorkspaceSwitcherDropdown
        trigger={
          <WorkspaceTrigger
            name={name}
            accentColor={accentColor}
            variant="popup"
            testId="popup-workspace-trigger"
          />
        }
        onManage={onManage}
      />
    </Flex>
  );
}
