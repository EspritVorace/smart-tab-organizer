import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Box, Button, Card, Flex, IconButton, Kbd, Text, Tooltip } from '@radix-ui/themes';
import { AlertCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageLayout } from '@/components/UI/PageLayout/PageLayout';
import { ListToolbar } from '@/components/UI/ListToolbar';
import { EmptyState } from '@/components/UI/EmptyState';
import { AccessibleHighlight } from '@/components/UI/AccessibleHighlight/AccessibleHighlight';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext';
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

function resolveDeleteTooltip(isDefault: boolean, isOnly: boolean): string {
  if (isDefault) return getMessage('workspaceDeleteDisabledDefault');
  if (isOnly) return getMessage('workspaceDeleteDisabledLast');
  return getMessage('workspaceDeleteLabel');
}

function WorkspaceRow({ workspace, isActive, isDefault, isOnly, searchTerm, index, onKeyDown, onSwitch, onEdit, onDelete }: WorkspaceRowProps) {
  const deleteBlocked = isDefault || isOnly;
  const deleteTooltip = resolveDeleteTooltip(isDefault, isOnly);

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
        <Flex align="center" gap="2">
          {!isActive ? (
            <Button
              data-testid={`workspace-row-${workspace.id}-switch`}
              variant="soft"
              size="2"
              onClick={onSwitch}
            >
              {getMessage('workspaceSwitchLabel')}
            </Button>
          ) : null}
          <Tooltip content={getMessage('workspaceEditLabel')}>
            <IconButton
              data-testid={`workspace-row-${workspace.id}-edit`}
              variant="ghost"
              size="2"
              aria-label={getMessage('workspaceEditLabel')}
              onClick={onEdit}
            >
              <Pencil size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip content={deleteTooltip}>
            <IconButton
              data-testid={`workspace-row-${workspace.id}-delete`}
              variant="ghost"
              size="2"
              color="red"
              disabled={deleteBlocked}
              aria-label={getMessage('workspaceDeleteLabel')}
              onClick={onDelete}
            >
              <Trash2 size={16} />
            </IconButton>
          </Tooltip>
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
  } = useActiveWorkspaceContext();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<WorkspaceMeta | null>(null);
  const [deleting, setDeleting] = useState<WorkspaceMeta | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const listRef = useRef<HTMLDivElement>(null);
  const { handleNavigationKey } = useListNavigation(listRef, '[data-workspace-card]');

  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>, index: number) => {
      if (e.target !== e.currentTarget) return;
      handleNavigationKey(e, index);
    },
    [handleNavigationKey],
  );

  const takenNames = workspaces.map((w) => w.name);

  const filteredWorkspaces = useMemo(() => {
    if (!searchTerm) return workspaces;
    const term = foldAccents(searchTerm);
    return workspaces.filter((ws) => foldAccents(ws.name).includes(term));
  }, [workspaces, searchTerm]);

  const handleOpenCreate = useCallback(() => setCreateOpen(true), []);

  useShortcuts({ 'list.workspaces.new': handleOpenCreate }, { scope: 'page:workspaces' });

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
