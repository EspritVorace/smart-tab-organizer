import React from 'react';
import {
  Box,
  IconButton,
  ScrollArea,
} from '@radix-ui/themes';
import { ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { GroupRowBase } from './GroupRowBase';
import { GroupEditRow } from './GroupEditRow';
import { TabTreeEditorTabRow } from './TabTreeEditorTabRow';
import { AlertDialogShell } from './AlertDialogShell';
import { useTabTreeEditor } from './useTabTreeEditor';
import type { Session } from '@/types/session';
import styles from './TabTreeEditor.module.css';

export interface TabTreeEditorProps {
  /** The session being edited */
  session: Session;
  /** Called whenever the session changes — receives the updated session */
  onSessionChange: (updatedSession: Session) => void;
  /** Optional max height; adds a ScrollArea when set */
  maxHeight?: number | string;
}

export function TabTreeEditor({ session, onSessionChange, maxHeight }: TabTreeEditorProps) {
  const {
    expandedGroups,
    editingItemId,
    editUrl,
    setEditUrl,
    setUrlError,
    editGroupName,
    setEditGroupName,
    editGroupColor,
    setEditGroupColor,
    urlError,
    alertDialog,
    setAlertDialog,
    toggleGroup,
    openTabEdit,
    openGroupEdit,
    cancelEdit,
    saveTabEdit,
    saveGroupEdit,
    moveTabInContext,
    moveGroupInList,
    moveTabToGroup,
    handleDeleteTab,
    performDeleteTab,
    handleDeleteGroup,
  } = useTabTreeEditor(session, onSessionChange);

  const content = (
    <Box className={styles.container} role="list">
      {/* Groups */}
      {session.groups.map((group, groupIdx) => {
        const isExpanded = expandedGroups.has(group.id);
        const isEditingGroup = editingItemId === group.id;

        return (
          <React.Fragment key={group.id}>
            {/* Group row */}
            <Box role="listitem" className={styles.row}>
              {isEditingGroup ? (
                <GroupEditRow
                  name={editGroupName}
                  color={editGroupColor}
                  level={1}
                  onNameChange={setEditGroupName}
                  onColorChange={setEditGroupColor}
                  onSave={() => saveGroupEdit(group.id)}
                  onCancel={cancelEdit}
                />
              ) : (
                <GroupRowBase
                  color={group.color}
                  title={group.title}
                  tabCount={group.tabs.length}
                  isExpanded={isExpanded}
                  onToggleExpand={() => toggleGroup(group.id)}
                  level={1}
                  rightSlot={
                    <div className={styles.actions}>
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="gray"
                        disabled={groupIdx === 0}
                        onClick={() => moveGroupInList(group.id, 'up')}
                        aria-label={getMessage('tabEditorMoveUp')}
                        title={getMessage('tabEditorMoveUp')}
                      >
                        <ChevronUp size={12} />
                      </IconButton>
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="gray"
                        disabled={groupIdx === session.groups.length - 1}
                        onClick={() => moveGroupInList(group.id, 'down')}
                        aria-label={getMessage('tabEditorMoveDown')}
                        title={getMessage('tabEditorMoveDown')}
                      >
                        <ChevronDown size={12} />
                      </IconButton>
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="gray"
                        onClick={() => openGroupEdit(group)}
                        aria-label={getMessage('tabEditorEditGroup')}
                        title={getMessage('tabEditorEditGroup')}
                      >
                        <Pencil size={12} />
                      </IconButton>
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="red"
                        onClick={() =>
                          setAlertDialog({
                            type: 'delete_group',
                            groupId: group.id,
                            groupTitle: group.title,
                            tabCount: group.tabs.length,
                          })
                        }
                        aria-label={getMessage('tabEditorDeleteGroup')}
                        title={getMessage('tabEditorDeleteGroup')}
                      >
                        <Trash2 size={12} />
                      </IconButton>
                    </div>
                  }
                />
              )}
            </Box>

            {/* Group's tabs */}
            {isExpanded &&
              group.tabs.map((tab, tabIdx) => (
                <Box key={tab.id} role="listitem" className={styles.row}>
                  <TabTreeEditorTabRow
                    tab={tab}
                    tabIdx={tabIdx}
                    level={2}
                    groupId={group.id}
                    contextLength={group.tabs.length}
                    groups={session.groups}
                    showMoveDropdown={true}
                    isEditing={editingItemId === tab.id}
                    editUrl={editUrl}
                    urlError={urlError}
                    onEditUrlChange={setEditUrl}
                    onClearUrlError={() => setUrlError(null)}
                    onSaveEdit={() => saveTabEdit(tab.id)}
                    onCancelEdit={cancelEdit}
                    onOpenEdit={() => openTabEdit(tab)}
                    onMoveUp={() => moveTabInContext(tab.id, 'up', group.id)}
                    onMoveDown={() => moveTabInContext(tab.id, 'down', group.id)}
                    onMoveToGroup={(targetGroupId) => moveTabToGroup(tab.id, group.id, targetGroupId)}
                    onDelete={() => handleDeleteTab(tab.id, group.id)}
                  />
                </Box>
              ))}
          </React.Fragment>
        );
      })}

      {/* Ungrouped tabs */}
      {session.ungroupedTabs.map((tab, tabIdx) => (
        <Box key={tab.id} role="listitem" className={styles.row}>
          <TabTreeEditorTabRow
            tab={tab}
            tabIdx={tabIdx}
            level={1}
            groupId={null}
            contextLength={session.ungroupedTabs.length}
            groups={session.groups}
            showMoveDropdown={session.groups.length > 0}
            isEditing={editingItemId === tab.id}
            editUrl={editUrl}
            urlError={urlError}
            onEditUrlChange={setEditUrl}
            onClearUrlError={() => setUrlError(null)}
            onSaveEdit={() => saveTabEdit(tab.id)}
            onCancelEdit={cancelEdit}
            onOpenEdit={() => openTabEdit(tab)}
            onMoveUp={() => moveTabInContext(tab.id, 'up', null)}
            onMoveDown={() => moveTabInContext(tab.id, 'down', null)}
            onMoveToGroup={(targetGroupId) => moveTabToGroup(tab.id, null, targetGroupId)}
            onDelete={() => handleDeleteTab(tab.id, null)}
          />
        </Box>
      ))}

      {/* AlertDialog: delete last tab in group */}
      <AlertDialogShell
        open={alertDialog?.type === 'delete_last_tab'}
        onClose={() => setAlertDialog(null)}
        maxWidth="400px"
        title={getMessage('tabEditorLastTabTitle')}
        description={getMessage('tabEditorLastTabDescription')}
        softActionLabel={getMessage('tabEditorKeepEmptyGroup')}
        onSoftAction={() => {
          if (alertDialog?.type === 'delete_last_tab') {
            performDeleteTab(alertDialog.tabId, alertDialog.groupId, false);
          }
        }}
        destructiveActionLabel={getMessage('tabEditorDeleteEmptyGroup')}
        onDestructiveAction={() => {
          if (alertDialog?.type === 'delete_last_tab') {
            performDeleteTab(alertDialog.tabId, alertDialog.groupId, true);
          }
        }}
      />

      {/* AlertDialog: delete group */}
      <AlertDialogShell
        open={alertDialog?.type === 'delete_group'}
        onClose={() => setAlertDialog(null)}
        maxWidth="420px"
        title={getMessage('tabEditorDeleteGroupTitle', [
          alertDialog?.type === 'delete_group' ? alertDialog.groupTitle : '',
        ])}
        description={
          alertDialog?.type === 'delete_group'
            ? getMessage('tabEditorDeleteGroupDescription', [String(alertDialog.tabCount)])
            : ''
        }
        softActionLabel={getMessage('tabEditorUngroupTabs')}
        onSoftAction={() => {
          if (alertDialog?.type === 'delete_group') {
            handleDeleteGroup(alertDialog.groupId, 'ungroup_tabs');
          }
        }}
        destructiveActionLabel={
          alertDialog?.type === 'delete_group'
            ? getMessage('tabEditorDeleteGroupAndTabs', [String(alertDialog.tabCount)])
            : getMessage('delete')
        }
        onDestructiveAction={() => {
          if (alertDialog?.type === 'delete_group') {
            handleDeleteGroup(alertDialog.groupId, 'delete_tabs');
          }
        }}
      />
    </Box>
  );

  if (maxHeight) {
    return (
      <ScrollArea style={{ maxHeight }} scrollbars="vertical">
        {content}
      </ScrollArea>
    );
  }

  return content;
}
