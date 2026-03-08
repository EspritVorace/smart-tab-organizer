import React, { useState, useEffect, useCallback } from 'react';
import {
  Flex,
  Text,
  Box,
  IconButton,
  TextField,
  Button,
  ScrollArea,
  DropdownMenu,
  AlertDialog,
} from '@radix-ui/themes';
import { ChevronUp, ChevronDown, Pencil, Trash2, ArrowUpRight } from 'lucide-react';
import { getMessage } from '../../../utils/i18n';
import { extractDomain } from './tabTreeUtils';
import { TabRowBase } from './TabRowBase';
import { GroupRowBase } from './GroupRowBase';
import { ChromeColorPicker } from './ChromeColorPicker';
import type { ChromeGroupColor } from './tabTreeTypes';
import type { Session, SavedTab, SavedTabGroup } from '../../../types/session';
import styles from './TabTreeEditor.module.css';

export interface TabTreeEditorProps {
  /** The session being edited */
  session: Session;
  /** Called whenever the session changes — receives the updated session */
  onSessionChange: (updatedSession: Session) => void;
  /** Optional max height; adds a ScrollArea when set */
  maxHeight?: number | string;
}

type AlertDialogState =
  | { type: 'delete_last_tab'; tabId: string; groupId: string }
  | { type: 'delete_group'; groupId: string; groupTitle: string; tabCount: number }
  | null;

export function TabTreeEditor({ session, onSessionChange, maxHeight }: TabTreeEditorProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(session.groups.map((g) => g.id))
  );
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupColor, setEditGroupColor] = useState<ChromeGroupColor>('grey');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [alertDialog, setAlertDialog] = useState<AlertDialogState>(null);

  // Auto-expand newly added groups
  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const group of session.groups) {
        if (!next.has(group.id)) {
          next.add(group.id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [session.groups]);

  const now = () => new Date().toISOString();

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  function openTabEdit(tab: SavedTab) {
    setEditingItemId(tab.id);
    setEditUrl(tab.url);
    setUrlError(null);
  }

  function openGroupEdit(group: SavedTabGroup) {
    setEditingItemId(group.id);
    setEditGroupName(group.title);
    setEditGroupColor(group.color);
  }

  function cancelEdit() {
    setEditingItemId(null);
    setUrlError(null);
  }

  function saveTabEdit(tabId: string) {
    let url = editUrl.trim();
    // Auto-prefix https:// if no scheme is present
    if (url && !/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url)) {
      url = 'https://' + url;
    }
    try {
      new URL(url);
    } catch {
      setUrlError(getMessage('tabEditorUrlInvalid'));
      return;
    }
    onSessionChange({
      ...session,
      ungroupedTabs: session.ungroupedTabs.map((t) => (t.id === tabId ? { ...t, url } : t)),
      groups: session.groups.map((g) => ({
        ...g,
        tabs: g.tabs.map((t) => (t.id === tabId ? { ...t, url } : t)),
      })),
      updatedAt: now(),
    });
    setEditingItemId(null);
    setUrlError(null);
  }

  function saveGroupEdit(groupId: string) {
    onSessionChange({
      ...session,
      groups: session.groups.map((g) =>
        g.id === groupId ? { ...g, title: editGroupName, color: editGroupColor } : g
      ),
      updatedAt: now(),
    });
    setEditingItemId(null);
  }

  function moveTabInContext(tabId: string, direction: 'up' | 'down', contextGroupId: string | null) {
    if (contextGroupId === null) {
      const tabs = [...session.ungroupedTabs];
      const idx = tabs.findIndex((t) => t.id === tabId);
      if (idx === -1) return;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= tabs.length) return;
      [tabs[idx], tabs[newIdx]] = [tabs[newIdx], tabs[idx]];
      onSessionChange({ ...session, ungroupedTabs: tabs, updatedAt: now() });
    } else {
      const groups = session.groups.map((g) => {
        if (g.id !== contextGroupId) return g;
        const tabs = [...g.tabs];
        const idx = tabs.findIndex((t) => t.id === tabId);
        if (idx === -1) return g;
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= tabs.length) return g;
        [tabs[idx], tabs[newIdx]] = [tabs[newIdx], tabs[idx]];
        return { ...g, tabs };
      });
      onSessionChange({ ...session, groups, updatedAt: now() });
    }
  }

  function moveGroupInList(groupId: string, direction: 'up' | 'down') {
    const groups = [...session.groups];
    const idx = groups.findIndex((g) => g.id === groupId);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= groups.length) return;
    [groups[idx], groups[newIdx]] = [groups[newIdx], groups[idx]];
    onSessionChange({ ...session, groups, updatedAt: now() });
  }

  function moveTabToGroup(
    tabId: string,
    sourceGroupId: string | null,
    targetGroupId: string | null
  ) {
    let tab: SavedTab | undefined;
    let newUngrouped = session.ungroupedTabs;
    let newGroups = session.groups;

    if (sourceGroupId === null) {
      tab = session.ungroupedTabs.find((t) => t.id === tabId);
      newUngrouped = session.ungroupedTabs.filter((t) => t.id !== tabId);
    } else {
      const group = session.groups.find((g) => g.id === sourceGroupId);
      tab = group?.tabs.find((t) => t.id === tabId);
      newGroups = session.groups.map((g) =>
        g.id === sourceGroupId ? { ...g, tabs: g.tabs.filter((t) => t.id !== tabId) } : g
      );
    }

    if (!tab) return;

    if (targetGroupId === null) {
      newUngrouped = [...newUngrouped, tab];
    } else {
      newGroups = newGroups.map((g) =>
        g.id === targetGroupId ? { ...g, tabs: [...g.tabs, tab!] } : g
      );
    }

    onSessionChange({ ...session, ungroupedTabs: newUngrouped, groups: newGroups, updatedAt: now() });
  }

  function handleDeleteTab(tabId: string, sourceGroupId: string | null) {
    if (sourceGroupId !== null) {
      const group = session.groups.find((g) => g.id === sourceGroupId);
      if (group && group.tabs.length === 1) {
        setAlertDialog({ type: 'delete_last_tab', tabId, groupId: sourceGroupId });
        return;
      }
    }
    performDeleteTab(tabId, sourceGroupId, false);
  }

  function performDeleteTab(
    tabId: string,
    sourceGroupId: string | null,
    deleteEmptyGroup: boolean
  ) {
    const newUngrouped = session.ungroupedTabs.filter((t) => t.id !== tabId);
    let newGroups = session.groups.map((g) => ({
      ...g,
      tabs: g.tabs.filter((t) => t.id !== tabId),
    }));
    if (deleteEmptyGroup && sourceGroupId) {
      newGroups = newGroups.filter((g) => g.id !== sourceGroupId);
    }
    onSessionChange({ ...session, ungroupedTabs: newUngrouped, groups: newGroups, updatedAt: now() });
    setAlertDialog(null);
  }

  function handleDeleteGroup(groupId: string, action: 'delete_tabs' | 'ungroup_tabs') {
    const group = session.groups.find((g) => g.id === groupId);
    if (!group) return;
    const newUngrouped =
      action === 'ungroup_tabs'
        ? [...session.ungroupedTabs, ...group.tabs]
        : session.ungroupedTabs;
    const newGroups = session.groups.filter((g) => g.id !== groupId);
    onSessionChange({
      ...session,
      ungroupedTabs: newUngrouped,
      groups: newGroups,
      updatedAt: now(),
    });
    setAlertDialog(null);
  }

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

/* ─── Sub-components ──────────────────────────────────────────────────────── */

interface TabEditRowProps {
  url: string;
  error: string | null;
  level: number;
  onChange: (url: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function TabEditRow({ url, error, level, onChange, onSave, onCancel }: TabEditRowProps) {
  return (
    <Box
      style={{
        paddingLeft: (level - 1) * 20 + 8,
        paddingRight: 'var(--space-2)',
        paddingTop: 'var(--space-2)',
        paddingBottom: 'var(--space-2)',
      }}
    >
      <Flex direction="column" gap="2">
        <Flex align="center" gap="2">
          <Text size="1" color="gray" style={{ flexShrink: 0 }}>
            {getMessage('tabEditorUrlLabel')}:
          </Text>
          <TextField.Root
            value={url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter') onSave();
              if (e.key === 'Escape') onCancel();
            }}
            size="1"
            style={{ flex: 1 }}
            placeholder="https://example.com"
            aria-label={getMessage('tabEditorUrlLabel')}
            autoFocus
          />
        </Flex>
        {error && (
          <Text size="1" className={styles.urlError}>
            {error}
          </Text>
        )}
        <Flex gap="2" justify="end">
          <Button size="1" variant="soft" color="gray" onClick={onCancel}>
            {getMessage('cancel')}
          </Button>
          <Button size="1" onClick={onSave}>
            {getMessage('save')}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}

interface GroupEditRowProps {
  name: string;
  color: ChromeGroupColor;
  level: number;
  onNameChange: (name: string) => void;
  onColorChange: (color: ChromeGroupColor) => void;
  onSave: () => void;
  onCancel: () => void;
}

function GroupEditRow({
  name,
  color,
  level,
  onNameChange,
  onColorChange,
  onSave,
  onCancel,
}: GroupEditRowProps) {
  return (
    <Box
      style={{
        paddingLeft: (level - 1) * 20 + 8,
        paddingRight: 'var(--space-2)',
        paddingTop: 'var(--space-2)',
        paddingBottom: 'var(--space-2)',
      }}
    >
      <Flex direction="column" gap="2">
        <Flex align="center" gap="2">
          <TextField.Root
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter') onSave();
              if (e.key === 'Escape') onCancel();
            }}
            size="1"
            style={{ flex: 1 }}
            placeholder={getMessage('tabEditorGroupNameLabel')}
            aria-label={getMessage('tabEditorGroupNameLabel')}
            autoFocus
          />
          <ChromeColorPicker value={color} onChange={onColorChange} />
        </Flex>
        <Flex gap="2" justify="end">
          <Button size="1" variant="soft" color="gray" onClick={onCancel}>
            {getMessage('cancel')}
          </Button>
          <Button size="1" onClick={onSave}>
            {getMessage('save')}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}

interface MoveTabDropdownProps {
  currentGroupId: string | null;
  groups: SavedTabGroup[];
  onMove: (targetGroupId: string | null) => void;
}

function MoveTabDropdown({ currentGroupId, groups, onMove }: MoveTabDropdownProps) {
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
