import React from 'react';
import {
  Flex,
  Text,
  Box,
  IconButton,
  Button,
  ScrollArea,
  AlertDialog,
} from '@radix-ui/themes';
import { ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { getMessage } from '../../../utils/i18n';
import { extractDomain } from '../../../utils/tabTreeUtils';
import { TabRowBase } from './TabRowBase';
import { GroupRowBase } from './GroupRowBase';
import { TabEditRow } from './TabEditRow';
import { GroupEditRow } from './GroupEditRow';
import { MoveTabDropdown } from './MoveTabDropdown';
import { useTabTreeEditor } from './useTabTreeEditor';
import type { Session } from '../../../types/session';
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
                        <ChevronUp size={12} aria-hidden="true" />
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
                        <ChevronDown size={12} aria-hidden="true" />
                      </IconButton>
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="gray"
                        onClick={() => openGroupEdit(group)}
                        aria-label={getMessage('tabEditorEditGroup')}
                        title={getMessage('tabEditorEditGroup')}
                      >
                        <Pencil size={12} aria-hidden="true" />
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
                        <Trash2 size={12} aria-hidden="true" />
                      </IconButton>
                    </div>
                  }
                />
              )}
            </Box>

            {/* Group's tabs */}
            {isExpanded &&
              group.tabs.map((tab, tabIdx) => {
                const isEditingTab = editingItemId === tab.id;
                return (
                  <Box key={tab.id} role="listitem" className={styles.row}>
                    {isEditingTab ? (
                      <TabEditRow
                        url={editUrl}
                        error={urlError}
                        level={2}
                        onChange={(url) => {
                          setEditUrl(url);
                          setUrlError(null);
                        }}
                        onSave={() => saveTabEdit(tab.id)}
                        onCancel={cancelEdit}
                      />
                    ) : (
                      <TabRowBase
                        favIconUrl={tab.favIconUrl}
                        title={tab.title}
                        domain={extractDomain(tab.url)}
                        fullUrl={tab.url}
                        level={2}
                        showTooltip={false}
                        rightSlot={
                          <div className={styles.actions}>
                            <IconButton
                              size="1"
                              variant="ghost"
                              color="gray"
                              disabled={tabIdx === 0}
                              onClick={() => moveTabInContext(tab.id, 'up', group.id)}
                              aria-label={getMessage('tabEditorMoveUp')}
                              title={getMessage('tabEditorMoveUp')}
                            >
                              <ChevronUp size={12} aria-hidden="true" />
                            </IconButton>
                            <IconButton
                              size="1"
                              variant="ghost"
                              color="gray"
                              disabled={tabIdx === group.tabs.length - 1}
                              onClick={() => moveTabInContext(tab.id, 'down', group.id)}
                              aria-label={getMessage('tabEditorMoveDown')}
                              title={getMessage('tabEditorMoveDown')}
                            >
                              <ChevronDown size={12} aria-hidden="true" />
                            </IconButton>
                            <IconButton
                              size="1"
                              variant="ghost"
                              color="gray"
                              onClick={() => openTabEdit(tab)}
                              aria-label={getMessage('tabEditorEditTab')}
                              title={getMessage('tabEditorEditTab')}
                            >
                              <Pencil size={12} aria-hidden="true" />
                            </IconButton>
                            <MoveTabDropdown
                              currentGroupId={group.id}
                              groups={session.groups}
                              onMove={(targetGroupId) =>
                                moveTabToGroup(tab.id, group.id, targetGroupId)
                              }
                            />
                            <IconButton
                              size="1"
                              variant="ghost"
                              color="red"
                              onClick={() => handleDeleteTab(tab.id, group.id)}
                              aria-label={getMessage('tabEditorDeleteTab')}
                              title={getMessage('tabEditorDeleteTab')}
                            >
                              <Trash2 size={12} aria-hidden="true" />
                            </IconButton>
                          </div>
                        }
                      />
                    )}
                  </Box>
                );
              })}
          </React.Fragment>
        );
      })}

      {/* Ungrouped tabs */}
      {session.ungroupedTabs.map((tab, tabIdx) => {
        const isEditingTab = editingItemId === tab.id;
        const hasMoveTargets = session.groups.length > 0;
        return (
          <Box key={tab.id} role="listitem" className={styles.row}>
            {isEditingTab ? (
              <TabEditRow
                url={editUrl}
                error={urlError}
                level={1}
                onChange={(url) => {
                  setEditUrl(url);
                  setUrlError(null);
                }}
                onSave={() => saveTabEdit(tab.id)}
                onCancel={cancelEdit}
              />
            ) : (
              <TabRowBase
                favIconUrl={tab.favIconUrl}
                title={tab.title}
                domain={extractDomain(tab.url)}
                fullUrl={tab.url}
                level={1}
                showTooltip={false}
                rightSlot={
                  <div className={styles.actions}>
                    <IconButton
                      size="1"
                      variant="ghost"
                      color="gray"
                      disabled={tabIdx === 0}
                      onClick={() => moveTabInContext(tab.id, 'up', null)}
                      aria-label={getMessage('tabEditorMoveUp')}
                      title={getMessage('tabEditorMoveUp')}
                    >
                      <ChevronUp size={12} aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      size="1"
                      variant="ghost"
                      color="gray"
                      disabled={tabIdx === session.ungroupedTabs.length - 1}
                      onClick={() => moveTabInContext(tab.id, 'down', null)}
                      aria-label={getMessage('tabEditorMoveDown')}
                      title={getMessage('tabEditorMoveDown')}
                    >
                      <ChevronDown size={12} aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      size="1"
                      variant="ghost"
                      color="gray"
                      onClick={() => openTabEdit(tab)}
                      aria-label={getMessage('tabEditorEditTab')}
                      title={getMessage('tabEditorEditTab')}
                    >
                      <Pencil size={12} aria-hidden="true" />
                    </IconButton>
                    {hasMoveTargets && (
                      <MoveTabDropdown
                        currentGroupId={null}
                        groups={session.groups}
                        onMove={(targetGroupId) =>
                          moveTabToGroup(tab.id, null, targetGroupId)
                        }
                      />
                    )}
                    <IconButton
                      size="1"
                      variant="ghost"
                      color="red"
                      onClick={() => handleDeleteTab(tab.id, null)}
                      aria-label={getMessage('tabEditorDeleteTab')}
                      title={getMessage('tabEditorDeleteTab')}
                    >
                      <Trash2 size={12} aria-hidden="true" />
                    </IconButton>
                  </div>
                }
              />
            )}
          </Box>
        );
      })}

      {/* AlertDialog: delete last tab in group */}
      <AlertDialog.Root
        open={alertDialog?.type === 'delete_last_tab'}
        onOpenChange={(open) => {
          if (!open) setAlertDialog(null);
        }}
      >
        <AlertDialog.Content maxWidth="400px">
          <AlertDialog.Title>{getMessage('tabEditorLastTabTitle')}</AlertDialog.Title>
          <AlertDialog.Description size="2">
            {getMessage('tabEditorLastTabDescription')}
          </AlertDialog.Description>
          <Flex gap="2" mt="4" justify="end" wrap="wrap">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                {getMessage('cancel')}
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant="soft"
              onClick={() => {
                if (alertDialog?.type === 'delete_last_tab') {
                  performDeleteTab(alertDialog.tabId, alertDialog.groupId, false);
                }
              }}
            >
              {getMessage('tabEditorKeepEmptyGroup')}
            </Button>
            <AlertDialog.Action>
              <Button
                color="red"
                onClick={() => {
                  if (alertDialog?.type === 'delete_last_tab') {
                    performDeleteTab(alertDialog.tabId, alertDialog.groupId, true);
                  }
                }}
              >
                {getMessage('tabEditorDeleteEmptyGroup')}
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      {/* AlertDialog: delete group */}
      <AlertDialog.Root
        open={alertDialog?.type === 'delete_group'}
        onOpenChange={(open) => {
          if (!open) setAlertDialog(null);
        }}
      >
        <AlertDialog.Content maxWidth="420px">
          <AlertDialog.Title>
            {getMessage('tabEditorDeleteGroupTitle', [
              alertDialog?.type === 'delete_group' ? alertDialog.groupTitle : '',
            ])}
          </AlertDialog.Title>
          <AlertDialog.Description size="2">
            {alertDialog?.type === 'delete_group'
              ? getMessage('tabEditorDeleteGroupDescription', [String(alertDialog.tabCount)])
              : ''}
          </AlertDialog.Description>
          <Flex gap="2" mt="4" justify="end" wrap="wrap">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                {getMessage('cancel')}
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant="soft"
              onClick={() => {
                if (alertDialog?.type === 'delete_group') {
                  handleDeleteGroup(alertDialog.groupId, 'ungroup_tabs');
                }
              }}
            >
              {getMessage('tabEditorUngroupTabs')}
            </Button>
            <AlertDialog.Action>
              <Button
                color="red"
                onClick={() => {
                  if (alertDialog?.type === 'delete_group') {
                    handleDeleteGroup(alertDialog.groupId, 'delete_tabs');
                  }
                }}
              >
                {alertDialog?.type === 'delete_group'
                  ? getMessage('tabEditorDeleteGroupAndTabs', [String(alertDialog.tabCount)])
                  : getMessage('delete')}
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
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
