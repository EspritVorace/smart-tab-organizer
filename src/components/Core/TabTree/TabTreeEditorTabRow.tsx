import { IconButton } from '@radix-ui/themes';
import { ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { extractDomain } from '@/utils/tabTreeUtils';
import { TabRowBase } from './TabRowBase';
import { TabEditRow } from './TabEditRow';
import { MoveTabDropdown } from './MoveTabDropdown';
import type { SavedTab, SavedTabGroup } from '@/types/session';
import styles from './TabTreeEditor.module.css';

export interface TabTreeEditorTabRowProps {
  tab: SavedTab;
  /** Zero-based index within the current context (group or ungrouped list). */
  tabIdx: number;
  /** Tree indentation level: 2 for grouped tabs, 1 for ungrouped tabs. */
  level: 1 | 2;
  /** Id of the parent group, or null for ungrouped tabs. */
  groupId: string | null;
  /** Total number of tabs in the current context (used to compute last-item disabled state). */
  contextLength: number;
  /** Groups in the session, used to populate the MoveTabDropdown. */
  groups: SavedTabGroup[];
  /**
   * Whether the MoveTab dropdown should be shown. For grouped tabs this is
   * always true; for ungrouped tabs it is only shown when at least one group
   * exists in the session.
   */
  showMoveDropdown: boolean;
  /** Whether this tab is currently being edited. */
  isEditing: boolean;
  /** Current edit URL value (only relevant when isEditing = true). */
  editUrl: string;
  /** Current URL validation error (null = no error). */
  urlError: string | null;
  onEditUrlChange: (url: string) => void;
  onClearUrlError: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onOpenEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToGroup: (targetGroupId: string | null) => void;
  onDelete: () => void;
}

/**
 * Renders a single tab row inside the TabTreeEditor, handling both the
 * read view (TabRowBase + action buttons) and the edit view (TabEditRow).
 * Used for both grouped tabs (level=2) and ungrouped tabs (level=1).
 */
export function TabTreeEditorTabRow({
  tab,
  tabIdx,
  level,
  groupId,
  contextLength,
  groups,
  showMoveDropdown,
  isEditing,
  editUrl,
  urlError,
  onEditUrlChange,
  onClearUrlError,
  onSaveEdit,
  onCancelEdit,
  onOpenEdit,
  onMoveUp,
  onMoveDown,
  onMoveToGroup,
  onDelete,
}: TabTreeEditorTabRowProps) {
  if (isEditing) {
    return (
      <TabEditRow
        url={editUrl}
        error={urlError}
        level={level}
        onChange={(url) => {
          onEditUrlChange(url);
          onClearUrlError();
        }}
        onSave={onSaveEdit}
        onCancel={onCancelEdit}
      />
    );
  }

  return (
    <TabRowBase
      favIconUrl={tab.favIconUrl}
      title={tab.title}
      domain={extractDomain(tab.url)}
      fullUrl={tab.url}
      level={level}
      showTooltip={false}
      rightSlot={
        <div className={styles.actions}>
          <IconButton
            size="1"
            variant="ghost"
            color="gray"
            disabled={tabIdx === 0}
            onClick={onMoveUp}
            aria-label={getMessage('tabEditorMoveUp')}
            title={getMessage('tabEditorMoveUp')}
          >
            <ChevronUp size={12} />
          </IconButton>
          <IconButton
            size="1"
            variant="ghost"
            color="gray"
            disabled={tabIdx === contextLength - 1}
            onClick={onMoveDown}
            aria-label={getMessage('tabEditorMoveDown')}
            title={getMessage('tabEditorMoveDown')}
          >
            <ChevronDown size={12} />
          </IconButton>
          <IconButton
            size="1"
            variant="ghost"
            color="gray"
            onClick={onOpenEdit}
            aria-label={getMessage('tabEditorEditTab')}
            title={getMessage('tabEditorEditTab')}
          >
            <Pencil size={12} />
          </IconButton>
          {showMoveDropdown && (
            <MoveTabDropdown
              currentGroupId={groupId}
              groups={groups}
              onMove={onMoveToGroup}
            />
          )}
          <IconButton
            size="1"
            variant="ghost"
            color="red"
            onClick={onDelete}
            aria-label={getMessage('tabEditorDeleteTab')}
            title={getMessage('tabEditorDeleteTab')}
          >
            <Trash2 size={12} />
          </IconButton>
        </div>
      }
    />
  );
}
