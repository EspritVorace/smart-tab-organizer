import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Box, Button, Card, DropdownMenu, Flex, IconButton, Kbd, Text, Tooltip } from '@radix-ui/themes';
import { AlertCircle, Check, MoreHorizontal, Pencil, Plus, Upload } from 'lucide-react';
import { PageLayout } from '@/components/UI/PageLayout/PageLayout';
import { ListToolbar, ListToolbarMenu } from '@/components/UI/ListToolbar';
import { EmptyState } from '@/components/UI/EmptyState';
import { DeleteMenuItem } from '@/components/UI/DeleteMenuItem/DeleteMenuItem';
import { AccessibleHighlight } from '@/components/UI/AccessibleHighlight/AccessibleHighlight';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext';
import { useImportExportWizards } from '@/contexts/ImportExportWizardsContext';
import { WorkspaceAvatar } from '@/components/UI/Workspace/WorkspaceAvatar';
import { WorkspaceFormDialog } from '@/components/UI/Workspace/WorkspaceFormDialog';
import { WorkspaceDeleteConfirmDialog } from '@/components/UI/Workspace/WorkspaceDeleteConfirmDialog';
import { DEFAULT_WORKSPACE_ID } from '@/utils/workspaceStorage';
import { getMessage } from '@/utils/i18n';
import { logger } from '@/utils/logger';
import { foldAccents } from '@/utils/stringUtils';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useListNavigation } from '@/hooks/useListNavigation';
import { useRelativeTime } from '@/hooks/useRelativeTime';
import type { AppSettings } from '@/types/syncSettings';
import type { WorkspaceMeta } from '@/schemas/workspace';

interface WorkspacesPageProps {
  syncSettings: AppSettings;
}

interface WorkspaceRowProps {
  workspace: WorkspaceMeta;
  isActive: boolean;
  isDefault: boolean;
  isOnly: boolean;
  searchTerm: string;
  index: number;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>, index: number) => void;
  onSwitch: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function WorkspaceRow({ workspace, isActive, isDefault, isOnly, searchTerm, index, onKeyDown, onSwitch, onEdit, onDelete }: WorkspaceRowProps) {
  const deleteBlocked = isDefault || isOnly;

  const isUpdated = workspace.updatedAt !== workspace.createdAt;
  const relativeDate = isUpdated ? workspace.updatedAt : workspace.createdAt;
  const relativePrefix = isUpdated
    ? getMessage('workspaceModifiedPrefix')
    : getMessage('workspaceCreatedPrefix');
  const relativeText = useRelativeTime(relativeDate);

  return (
    <Card
      data-testid={`workspace-row-${workspace.id}`}
      data-workspace-card=""
      data-workspace-id={workspace.id}
      data-shortcut-scope="widget:workspace-card"
      variant="surface"
      role="listitem"
      tabIndex={0}
      onKeyDown={(e) => onKeyDown(e, index)}
    >
      <Flex align="center" gap="3">
        <WorkspaceAvatar name={workspace.name} accentColor={workspace.accentColor} size="md" />
        <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
          <Flex align="center" gap="2">
            <Text size="3" weight="medium">
              <AccessibleHighlight text={workspace.name} searchTerm={searchTerm} />
            </Text>
            {isActive ? (
              <Text size="1" color="gray" data-testid={`workspace-row-${workspace.id}-active`}>
                {getMessage('workspaceActiveBadge')}
              </Text>
            ) : null}
            {isDefault ? (
              <Text size="1" color="gray" data-testid={`workspace-row-${workspace.id}-default`}>
                {getMessage('workspaceDefaultBadge')}
              </Text>
            ) : null}
          </Flex>
          <Text size="1" color="gray" data-testid={`workspace-row-${workspace.id}-relative-time`}>
            {relativePrefix}{' '}
            <time dateTime={relativeDate}>{relativeText}</time>
          </Text>
        </Flex>
        <Flex align="center" gap="3" style={{ flexShrink: 0 }}>
          {!isActive ? (
            <Tooltip content={<Flex align="center" gap="2" aria-hidden="true">{getMessage('workspaceSwitchLabel')}<Kbd>Enter</Kbd></Flex>}>
              <Button
                data-testid={`workspace-row-${workspace.id}-switch`}
                variant="soft"
                size="2"
                onClick={onSwitch}
              >
                <Check size={16} />
                {getMessage('workspaceSwitchLabel')}
              </Button>
            </Tooltip>
          ) : null}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <IconButton
                data-testid={`workspace-row-${workspace.id}-btn-dropdown`}
                size="2"
                variant="ghost"
                color="gray"
                aria-label={getMessage('workspaceMoreActions')}
              >
                <MoreHorizontal size={16} />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item
                data-testid={`workspace-row-${workspace.id}-menu-edit`}
                onClick={onEdit}
              >
                <Flex align="center" justify="between" gap="3" width="100%">
                  <Flex align="center" gap="2">
                    <Pencil size={14} aria-hidden="true" />
                    {getMessage('workspaceEditLabel')}
                  </Flex>
                  <Kbd size="1">E</Kbd>
                </Flex>
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DeleteMenuItem
                data-testid={`workspace-row-${workspace.id}-menu-delete`}
                disabled={deleteBlocked}
                onClick={onDelete}
              />
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>
      </Flex>
    </Card>
  );
}

export function WorkspacesPage({ syncSettings }: WorkspacesPageProps) {
  const {
    workspaces,
    activeId,
    switchTo,
    createWorkspace,
    renameWorkspace,
    setWorkspaceColor,
    removeWorkspace,
    isLoaded,
  } = useActiveWorkspaceContext();
  const { openImportWorkspace } = useImportExportWizards();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<WorkspaceMeta | null>(null);
  const [deleting, setDeleting] = useState<WorkspaceMeta | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const listRef = useRef<HTMLDivElement>(null);
  const { handleNavigationKey } = useListNavigation(listRef, '[data-workspace-card]', {
    autoFocus: { ready: isLoaded },
  });

  // Resolves the workspace whose card currently has keyboard focus, so the
  // widget-scoped shortcuts (`e`, `Delete`) and Enter-to-activate act on the
  // right row. Mirrors `getFocusedRule` in DomainRulesPage.
  const getFocusedWorkspace = useCallback((): WorkspaceMeta | null => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) return null;
    if (!active.matches('[data-shortcut-scope="widget:workspace-card"]')) return null;
    const id = active.getAttribute('data-workspace-id');
    if (!id) return null;
    return workspaces.find((w) => w.id === id) ?? null;
  }, [workspaces]);

  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>, index: number) => {
      if (e.target !== e.currentTarget) return;
      if (handleNavigationKey(e, index)) return;
      // Enter activates the focused workspace (card-local, like Enter on a rule
      // card). The registry only owns `e` / `Delete` for this scope.
      if (e.key === 'Enter' && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const focused = getFocusedWorkspace();
        if (focused && focused.id !== activeId) {
          e.preventDefault();
          void switchTo(focused.id);
        }
      }
    },
    [handleNavigationKey, getFocusedWorkspace, activeId, switchTo],
  );

  const takenNames = workspaces.map((w) => w.name);

  const filteredWorkspaces = useMemo(() => {
    if (!searchTerm) return workspaces;
    const term = foldAccents(searchTerm);
    return workspaces.filter((ws) => foldAccents(ws.name).includes(term));
  }, [workspaces, searchTerm]);

  const handleOpenCreate = useCallback(() => setCreateOpen(true), []);

  useShortcuts({ 'list.workspaces.new': handleOpenCreate }, { scope: 'page:workspaces' });

  useShortcuts(
    {
      'workspaceCard.edit': () => {
        const focused = getFocusedWorkspace();
        if (focused) setEditing(focused);
      },
      'workspaceCard.delete': () => {
        const focused = getFocusedWorkspace();
        if (!focused) return;
        const deleteBlocked = focused.id === DEFAULT_WORKSPACE_ID || workspaces.length === 1;
        if (!deleteBlocked) setDeleting(focused);
      },
    },
    { scope: 'widget:workspace-card' },
  );

  const handleCreate = useCallback(
    async ({ name, accentColor }: { name: string; accentColor: WorkspaceMeta['accentColor'] }) => {
      try {
        await createWorkspace(name, accentColor);
      } catch (error) {
        logger.error('[WorkspacesPage] create failed:', error);
      }
    },
    [createWorkspace],
  );

  const handleEditSubmit = useCallback(
    async ({ name, accentColor }: { name: string; accentColor: WorkspaceMeta['accentColor'] }) => {
      if (!editing) return;
      try {
        if (name !== editing.name) await renameWorkspace(editing.id, name);
        if (accentColor !== editing.accentColor) await setWorkspaceColor(editing.id, accentColor);
      } catch (error) {
        logger.error('[WorkspacesPage] edit failed:', error);
      }
    },
    [editing, renameWorkspace, setWorkspaceColor],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleting) return;
    try {
      await removeWorkspace(deleting.id);
    } catch (error) {
      logger.error('[WorkspacesPage] delete failed:', error);
    }
  }, [deleting, removeWorkspace]);

  return (
    <PageLayout
      titleKey="workspacesTab"
      descriptionKey="workspacesDescription"
      syncSettings={syncSettings}
    >
      {() => (
        <Box data-testid="page-workspaces">
          {workspaces.length > 0 && (
            <ListToolbar
              testId="page-workspaces-toolbar"
              searchTestId="page-workspaces-search"
              searchPlaceholder={getMessage('searchWorkspaces')}
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              action={
                <Tooltip content={<Flex align="center" gap="2" aria-hidden="true">{getMessage('workspaceCreateLabel')}<Kbd>N</Kbd></Flex>}>
                  <Button
                    data-testid="workspace-create-button"
                    variant="solid"
                    onClick={handleOpenCreate}
                    aria-keyshortcuts="N"
                  >
                    <Plus size={16} />
                    {getMessage('workspaceCreateLabel')}
                  </Button>
                </Tooltip>
              }
              menu={
                <ListToolbarMenu
                  testId="page-workspaces-toolbar-menu"
                  ariaLabel={getMessage('importWorkspaceTitle')}
                  items={[
                    {
                      key: 'import',
                      testId: 'page-workspaces-toolbar-menu-import',
                      icon: Upload,
                      label: getMessage('importWorkspaceTitle'),
                      onSelect: () => openImportWorkspace(),
                    },
                  ]}
                />
              }
            />
          )}

          {filteredWorkspaces.length === 0 && searchTerm && (
            <EmptyState compact icon={AlertCircle} message={getMessage('noWorkspacesFound')} />
          )}

          {filteredWorkspaces.length > 0 && (
            <Box data-testid="workspace-list">
              <Flex ref={listRef} direction="column" gap="2" role="list">
                {filteredWorkspaces.map((ws, index) => (
                  <WorkspaceRow
                    key={ws.id}
                    workspace={ws}
                    isActive={ws.id === activeId}
                    isDefault={ws.id === DEFAULT_WORKSPACE_ID}
                    isOnly={workspaces.length === 1}
                    searchTerm={searchTerm}
                    index={index}
                    onKeyDown={handleCardKeyDown}
                    onSwitch={() => void switchTo(ws.id)}
                    onEdit={() => setEditing(ws)}
                    onDelete={() => setDeleting(ws)}
                  />
                ))}
              </Flex>
            </Box>
          )}

          <WorkspaceFormDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            takenNames={takenNames}
            onSubmit={handleCreate}
          />
          <WorkspaceFormDialog
            open={!!editing}
            onOpenChange={(o) => { if (!o) setEditing(null); }}
            initial={editing ?? undefined}
            takenNames={takenNames}
            onSubmit={handleEditSubmit}
          />
          <WorkspaceDeleteConfirmDialog
            open={!!deleting}
            onOpenChange={(o) => { if (!o) setDeleting(null); }}
            workspace={deleting}
            onConfirm={handleDeleteConfirm}
          />
        </Box>
      )}
    </PageLayout>
  );
}
