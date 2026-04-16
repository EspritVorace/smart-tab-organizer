import { DropdownMenu, IconButton } from '@radix-ui/themes';
import { ArrowUpRight } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import type { SavedTabGroup } from '@/types/session';

export interface MoveTabDropdownProps {
  currentGroupId: string | null;
  groups: SavedTabGroup[];
  onMove: (targetGroupId: string | null) => void;
}

export function MoveTabDropdown({ currentGroupId, groups, onMove }: MoveTabDropdownProps) {
  const otherGroups = groups.filter((g) => g.id !== currentGroupId);
  const canUngroup = currentGroupId !== null;

  if (otherGroups.length === 0 && !canUngroup) return null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton
          size="1"
          variant="ghost"
          color="gray"
          aria-label={getMessage('tabEditorMoveTab')}
          title={getMessage('tabEditorMoveTab')}
        >
          <ArrowUpRight size={12} aria-hidden="true" />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {otherGroups.map((g) => (
          <DropdownMenu.Item key={g.id} onClick={() => onMove(g.id)}>
            {g.title}
          </DropdownMenu.Item>
        ))}
        {canUngroup && (
          <>
            {otherGroups.length > 0 && <DropdownMenu.Separator />}
            <DropdownMenu.Item onClick={() => onMove(null)}>
              {getMessage('tabEditorUngroupedTabs')}
            </DropdownMenu.Item>
          </>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
