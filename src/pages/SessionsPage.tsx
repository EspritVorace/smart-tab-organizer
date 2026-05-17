import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Box, Flex, Button, Text, Callout, Separator, Badge } from '@radix-ui/themes';
import { Camera, Archive, CheckCircle, Pin, PinOff, Upload, Trash2, FileDown, type LucideIcon } from 'lucide-react';
import { DragDropProvider, type DragOverEvent, type DragEndEvent } from '@dnd-kit/react';
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { move } from '@dnd-kit/helpers';
import { PageLayout } from '@/components/UI/PageLayout/PageLayout';
import { EmptyState } from '@/components/UI/EmptyState';
import { SessionCard } from '@/components/Core/Session/SessionCard';
import { SessionEditDialog } from '@/components/Core/Session/SessionEditDialog';
import { SnapshotWizard } from '@/components/UI/SessionWizards/SnapshotWizard';
import { RestoreWizard } from '@/components/UI/SessionWizards/RestoreWizard';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog/ConfirmDialog';
import { ListToolbar } from '@/components/UI/ListToolbar';
import { BulkActionsBar } from '@/components/UI/BulkActionsBar';
import { ExportSessionsWizard } from '@/components/UI/ImportExportWizards/ExportSessionsWizard';
import { getMessage } from '@/utils/i18n';
import { foldAccents } from '@/utils/stringUtils';
import { matchSessionSearch, splitByPinned, getFocusedSessionFromDOM } from '@/utils/sessionUtils';
import { moveSessionToFirstInGroup, moveSessionToLastInGroup } from '@/utils/sessionOrderUtils';
import { useSessions } from '@/hooks/useSessions';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useListNavigation } from '@/hooks/useListNavigation';
import { useImportExportWizards } from '@/contexts/ImportExportWizardsContext';
import { restoreSessionTabs, type RestoreTarget } from '@/utils/tabRestore';
import { updateSession } from '@/utils/sessionStorage';
import { showSuccessNotification } from '@/utils/notifications';
import { browser } from 'wxt/browser';
import type { Session } from '@/types/session';
import type { SessionSearchMatch } from '@/utils/sessionUtils';
import type { AppSettings } from '@/types/syncSettings';

type BulkScope = 'pinned' | 'unpinned';

type DeleteTarget =
  | { type: 'single'; session: Session }
  | { type: 'bulk'; scope: BulkScope; ids: string[] };

/** Returns `prev` unchanged when every id is still visible, otherwise a new
 * Set restricted to ids present in `visible`. Used to keep section-local
 * selections in sync after delete / pin / search filtering. */
function pruneSelection(prev: Set<string>, visible: readonly { id: string }[]): Set<string> {
  const visibleIds = new Set(visible.map(s => s.id));
  let changed = false;
  const next = new Set<string>();
  for (const id of prev) {
    if (visibleIds.has(id)) next.add(id);
    else changed = true;
  }
  return changed ? next : prev;
}

interface SessionsPageProps {
  syncSettings: AppSettings;
  /** Controlled by options.tsx: true when a deep-link requests the snapshot wizard. */
  snapshotWizardOpen?: boolean;
  /** Called by SessionsPage to let options.tsx know the wizard closed (or page unmounted). */
  onSnapshotWizardOpenChange?: (open: boolean) => void;
  /** Chrome numeric groupId to pre-select in the snapshot wizard (null = all tabs). */
  snapshotGroupId?: number | null;
  /** Called when the snapshot wizard closes to reset the group context. */
  onSnapshotGroupIdChange?: (id: number | null) => void;
  /** Session id for which a deep-link requests the restore wizard to open. */
  restoreSessionId?: string | null;
  /** Called to clear the restore deep-link once consumed. */
  onRestoreSessionIdChange?: (id: string | null) => void;
}

function SectionHeader({ icon: Icon, titleKey, count }: { icon: LucideIcon; titleKey: string; count: number }) {
  return (
    <Flex align="center" gap="2">
      <Icon size={16} aria-hidden="true" style={{ color: 'var(--accent-9)' }} />
      <Text size="3" weight="bold">{getMessage(titleKey)}</Text>
      <Badge variant="soft" size="1">{count}</Badge>
    </Flex>
  );
}

interface SessionSectionProps {
  icon: LucideIcon;
  titleKey: string;
  emptyTitleKey: string;
  emptyDescriptionKey?: string;
  /** Whether this section lists the pinned sessions (drives drag reorder layout). */
  isPinned: boolean;
  /** Sessions displayed in this section (already filtered by search + split by pinned state). */
  sessions: Session[];
  /** Full ordered session list, used to recompute the global order after a drag and for move-to-first/last. */
  allSessions: Session[];
  searchQuery: string;
  searchMatches: Map<string, SessionSearchMatch> | null;
  /** Persist a new global session order. */
  updateOrder: (sessions: Session[]) => Promise<void>;
  /** Rename a session (forwarded straight to SessionCard). */
  renameSession: (id: string, newName: string) => Promise<void>;
  /** Open the RestoreWizard (owned by the parent). */
  onOpenRestoreWizard: (session: Session) => void;
  /** Open the SessionEditDialog (owned by the parent). */
  onOpenEditDialog: (session: Session) => void;
  /** Open the delete ConfirmDialog (owned by the parent). */
  onOpenDeleteDialog: (session: Session) => void;
  /** Quick-restore handlers shared with the page-level widget shortcuts. */
  onRestoreCurrentWindow: (session: Session) => void;
  onRestoreNewWindow: (session: Session) => void;
  onReplaceCurrentWindow: (session: Session) => void;
  /** Pin/unpin handlers shared with the page-level widget shortcuts. */
  onPin: (session: Session) => void;
  onUnpin: (session: Session) => void;
  /** Section-local bulk selection (independent between pinned and unpinned). */
  selectedIds: Set<string>;
  onSelectionChange: (next: Set<string>) => void;
  onBulkDeleteRequest: (ids: string[]) => void;
  onBulkExportRequest: (ids: string[]) => void;
  /** Bulk pin (in unpinned section) / unpin (in pinned section). */
  onBulkPinToggle: (ids: string[]) => void;
  /** Suffix appended to bulk testIds (e.g. 'pinned' / 'unpinned'). */
  testIdSuffix: BulkScope;
}

function SessionSection({
  icon,
  titleKey,
  emptyTitleKey,
  emptyDescriptionKey,
  isPinned,
  sessions,
  allSessions,
  searchQuery,
  searchMatches,
  updateOrder,
  renameSession,
  onOpenRestoreWizard,
  onOpenEditDialog,
  onOpenDeleteDialog,
  onRestoreCurrentWindow,
  onRestoreNewWindow,
  onReplaceCurrentWindow,
  onPin,
  onUnpin,
  selectedIds,
  onSelectionChange,
  onBulkDeleteRequest,
  onBulkExportRequest,
  onBulkPinToggle,
  testIdSuffix,
}: SessionSectionProps) {
  const [dragItems, setDragItems] = useState<Session[] | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Drag: reorder within this section, then splice back into the global order.
  const handleDragOver = useCallback((event: DragOverEvent) => {
    setDragItems(prev => move(prev ?? sessions, event));
  }, [sessions]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (!event.canceled) {
      const source = dragItems ?? sessions;
      const reordered = move(source, event) as Session[];
      const others = allSessions.filter(s => s.isPinned !== isPinned);
      const buildOrder = (section: Session[]) =>
        isPinned ? [...section, ...others] : [...others, ...section];
      if (reordered !== source) {
        void updateOrder(buildOrder(reordered));
      } else if (dragItems) {
        void updateOrder(buildOrder(dragItems));
      }
    }
    setDragItems(null);
  }, [dragItems, sessions, allSessions, isPinned, updateOrder]);

  const { handleNavigationKey } = useListNavigation(listRef, '[data-session-card]');

  // Card-level keydown is now navigation-only; per-card actions
  // (r/Shift+r/Alt+r/Alt+Shift+r/e/Delete/p) are dispatched at document level
  // through `useShortcuts({...}, { scope: 'widget:session-card' })` in
  // SessionsPage.
  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>, index: number) => {
      if (e.target !== e.currentTarget) return;
      handleNavigationKey(e, index);
    },
    [handleNavigationKey],
  );

  const handleMoveToFirst = useCallback((session: Session) => {
    void updateOrder(moveSessionToFirstInGroup(allSessions, session.id));
  }, [allSessions, updateOrder]);

  const handleMoveLast = useCallback((session: Session) => {
    void updateOrder(moveSessionToLastInGroup(allSessions, session.id));
  }, [allSessions, updateOrder]);

  const handleCardSelect = useCallback((id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    onSelectionChange(next);
  }, [selectedIds, onSelectionChange]);

  const handleSelectAll = useCallback((checked: boolean) => {
    onSelectionChange(checked ? new Set(sessions.map(s => s.id)) : new Set());
  }, [sessions, onSelectionChange]);

  const isAllSelected = sessions.length > 0 && selectedIds.size === sessions.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < sessions.length;

  // When a search is active, hide the whole section if it matched nothing.
  if (sessions.length === 0 && searchQuery) return null;
  return (
    <Box>
      <SectionHeader icon={icon} titleKey={titleKey} count={sessions.length} />
      {selectedIds.size > 0 && (
        <Box mt="3">
          <BulkActionsBar
            testId={`page-sessions-bulk-bar-${testIdSuffix}`}
            selectedCount={selectedIds.size}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            onSelectAll={handleSelectAll}
          >
            <Button
              size="1"
              variant="soft"
              data-testid={`page-sessions-bulk-btn-${isPinned ? 'unpin' : 'pin'}-${testIdSuffix}`}
              onClick={() => onBulkPinToggle(Array.from(selectedIds))}
            >
              {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
              {getMessage(isPinned ? 'unpinSelected' : 'pinSelected')}
            </Button>
            <Button
              size="1"
              variant="soft"
              data-testid={`page-sessions-bulk-btn-export-${testIdSuffix}`}
              onClick={() => onBulkExportRequest(Array.from(selectedIds))}
            >
              <FileDown size={14} />
              {getMessage('exportSelected')}
            </Button>
            <Button
              size="1"
              variant="solid"
              color="red"
              highContrast
              data-testid={`page-sessions-bulk-btn-delete-${testIdSuffix}`}
              onClick={() => onBulkDeleteRequest(Array.from(selectedIds))}
            >
              <Trash2 size={14} />
              {getMessage('deleteSelected')}
            </Button>
          </BulkActionsBar>
        </Box>
      )}
      {sessions.length === 0 ? (
        <EmptyState
          icon={icon}
          title={getMessage(emptyTitleKey)}
          description={emptyDescriptionKey ? getMessage(emptyDescriptionKey) : undefined}
          descriptionMaxWidth="none"
          minHeight={100}
        />
      ) : (
        <DragDropProvider
          modifiers={[RestrictToVerticalAxis]}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <Flex ref={listRef} direction="column" gap="3" mt="3" pl="6">
            {(dragItems ?? sessions).map((session, index) => {
              const searchMatch = searchMatches?.get(session.id);
              return (
                <SessionCard
                  key={session.id}
                  session={session}
                  existingSessions={allSessions}
                  isSelected={selectedIds.has(session.id)}
                  onSelect={handleCardSelect}
                  onRestore={onOpenRestoreWizard}
                  onRestoreCurrentWindow={onRestoreCurrentWindow}
                  onRestoreNewWindow={onRestoreNewWindow}
                  onReplaceCurrentWindow={onReplaceCurrentWindow}
                  onRename={renameSession}
                  onEdit={onOpenEditDialog}
                  onDelete={onOpenDeleteDialog}
                  onPin={onPin}
                  onUnpin={onUnpin}
                  forcePreviewOpen={searchMatch?.matchesTabs === true || searchMatch?.matchesNote === true}
                  searchMatchingGroupIds={searchMatch?.matchingGroupIds}
                  searchQuery={searchQuery || undefined}
                  index={index}
                  isDragDisabled={!!searchQuery}
                  onMoveToFirst={() => handleMoveToFirst(session)}
                  onMoveLast={() => handleMoveLast(session)}
                  onCardKeyDown={(e) => handleCardKeyDown(e, index)}
                />
              );
            })}
          </Flex>
        </DragDropProvider>
      )}
    </Box>
  );
}

export function SessionsPage({
  syncSettings,
  snapshotWizardOpen = false,
  onSnapshotWizardOpenChange,
  snapshotGroupId,
  onSnapshotGroupIdChange,
  restoreSessionId,
  onRestoreSessionIdChange,
}: SessionsPageProps) {
  const { openImportSessions } = useImportExportWizards();
  const { sessions, isLoaded, createSession, renameSession, removeSession, reload, updateOrder } = useSessions();
  // Internal open state; initialized from external prop so the wizard opens immediately on mount.
  const [snapshotOpen, setSnapshotOpen] = useState(snapshotWizardOpen);

  // Sync: if the external prop becomes true after mount (e.g. user already on sessions tab),
  // open the wizard.
  useEffect(() => {
    if (snapshotWizardOpen) setSnapshotOpen(true);
  }, [snapshotWizardOpen]);

  // When this component unmounts (user navigates away), reset the external flag so a
  // future mount doesn't re-open the wizard unexpectedly.
  useEffect(() => {
    return () => onSnapshotWizardOpenChange?.(false);
  }, [onSnapshotWizardOpenChange]);

  const [restoreSession, setRestoreSession] = useState<Session | null>(null);
  const [editTarget, setEditTarget] = useState<Session | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [bulkExportIds, setBulkExportIds] = useState<string[] | null>(null);
  const [selectedPinnedIds, setSelectedPinnedIds] = useState<Set<string>>(new Set());
  const [selectedUnpinnedIds, setSelectedUnpinnedIds] = useState<Set<string>>(new Set());
  const [quickRestoreMessage, setQuickRestoreMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenSnapshotWizard = useCallback(() => setSnapshotOpen(true), []);

  // Quick-restore (no conflict-resolution wizard) handlers shared by the
  // SessionCard split button, the dropdown menu, and the widget-scope
  // shortcuts registered below.
  const handleQuickRestore = useCallback(async (session: Session, target: RestoreTarget) => {
    try {
      let protectedTabId: number | undefined;
      if (target === 'replace') {
        const currentTab = await browser.tabs.getCurrent();
        protectedTabId = currentTab?.id;
      }
      const result = await restoreSessionTabs(session, target, protectedTabId);
      setQuickRestoreMessage(getMessage('restoreResultTabsCreated', [String(result.tabsCreated)]));
      if (target === 'replace') {
        void showSuccessNotification(
          getMessage('sessionSwitchedNotificationTitle'),
          getMessage('sessionSwitchedNotificationMessage', [session.name]),
        );
      }
    } catch {
      setQuickRestoreMessage(getMessage('restoreError'));
    }
    setTimeout(() => setQuickRestoreMessage(null), 4000);
  }, []);

  const handleRestoreCurrentWindow = useCallback(
    (session: Session) => { void handleQuickRestore(session, 'current'); },
    [handleQuickRestore],
  );
  const handleRestoreNewWindow = useCallback(
    (session: Session) => { void handleQuickRestore(session, 'new'); },
    [handleQuickRestore],
  );
  const handleReplaceCurrentWindow = useCallback(
    (session: Session) => { void handleQuickRestore(session, 'replace'); },
    [handleQuickRestore],
  );

  const handlePin = useCallback(async (session: Session) => {
    await updateSession(session.id, { isPinned: true });
    await reload();
  }, [reload]);
  const handleUnpin = useCallback(async (session: Session) => {
    await updateSession(session.id, { isPinned: false });
    await reload();
  }, [reload]);

  const getFocusedSession = useCallback(
    () => getFocusedSessionFromDOM(sessions),
    [sessions],
  );

  useShortcuts({ 'list.sessions.new': handleOpenSnapshotWizard }, { scope: 'page:sessions' });

  useShortcuts(
    {
      'sessionCard.restore.custom': () => {
        const focused = getFocusedSession();
        if (focused) setRestoreSession(focused);
      },
      'sessionCard.restore.current': () => {
        const focused = getFocusedSession();
        if (focused) handleRestoreCurrentWindow(focused);
      },
      'sessionCard.restore.replace': () => {
        const focused = getFocusedSession();
        if (focused) handleReplaceCurrentWindow(focused);
      },
      'sessionCard.restore.new': () => {
        const focused = getFocusedSession();
        if (focused) handleRestoreNewWindow(focused);
      },
      'sessionCard.edit': () => {
        const focused = getFocusedSession();
        if (focused) setEditTarget(focused);
      },
      'sessionCard.delete': () => {
        const focused = getFocusedSession();
        if (focused) setDeleteTarget({ type: 'single', session: focused });
      },
      'sessionCard.pin': () => {
        const focused = getFocusedSession();
        if (!focused) return;
        const togglePin = focused.isPinned ? handleUnpin : handlePin;
        togglePin(focused).catch(() => {});
      },
    },
    { scope: 'widget:session-card' },
  );

  // Deep-link: open the RestoreWizard when a sessionId has been provided via
  // URL hash (e.g. from the popup's customize restore action).
  useEffect(() => {
    if (!restoreSessionId || !isLoaded) return;
    const found = sessions.find((s) => s.id === restoreSessionId);
    if (found) {
      setRestoreSession(found);
      onRestoreSessionIdChange?.(null);
    }
  }, [restoreSessionId, isLoaded, sessions, onRestoreSessionIdChange]);

  // Order: use storage order directly (reorderSessions saves them in the correct order)
  const sortedSessions = sessions;

  // Deep search: name + group titles + tab titles + tab URLs
  const sessionSearchMatches = useMemo<Map<string, SessionSearchMatch> | null>(() => {
    if (!searchQuery) return null;
    const term = foldAccents(searchQuery);
    const map = new Map<string, SessionSearchMatch>();
    for (const session of sortedSessions) {
      const match = matchSessionSearch(session, term);
      if (match) map.set(session.id, match);
    }
    return map;
  }, [sortedSessions, searchQuery]);

  const displayedSessions = useMemo(() => {
    if (!sessionSearchMatches) return sortedSessions;
    return sortedSessions.filter(s => sessionSearchMatches.has(s.id));
  }, [sortedSessions, sessionSearchMatches]);

  const { pinned: pinnedSessions, unpinned: unpinnedSessions } = useMemo(
    () => splitByPinned(displayedSessions),
    [displayedSessions],
  );

  // Cleanup: drop selected ids that are no longer in their section (deleted,
  // pinned/unpinned, or filtered out by the search). This keeps the master
  // checkbox count in sync with what the user actually sees.
  useEffect(() => {
    setSelectedPinnedIds(prev => pruneSelection(prev, pinnedSessions));
  }, [pinnedSessions]);

  useEffect(() => {
    setSelectedUnpinnedIds(prev => pruneSelection(prev, unpinnedSessions));
  }, [unpinnedSessions]);

  const handleSaveSession = useCallback(
    async (session: Session) => {
      await createSession(session);
    },
    [createSession],
  );

  const handleSaveEditedSession = useCallback(
    async (updatedSession: Session) => {
      await updateSession(updatedSession.id, {
        name: updatedSession.name,
        groups: updatedSession.groups,
        ungroupedTabs: updatedSession.ungroupedTabs,
        categoryId: updatedSession.categoryId,
        note: updatedSession.note,
        updatedAt: updatedSession.updatedAt,
      });
      await reload();
    },
    [reload],
  );

  const handleBulkPinToggle = useCallback(async (ids: string[], makePinned: boolean) => {
    for (const id of ids) {
      await updateSession(id, { isPinned: makePinned });
    }
    await reload();
  }, [reload]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'single') {
      await removeSession(deleteTarget.session.id);
    } else {
      for (const id of deleteTarget.ids) {
        await removeSession(id);
      }
      if (deleteTarget.scope === 'pinned') setSelectedPinnedIds(new Set());
      else setSelectedUnpinnedIds(new Set());
    }
    setDeleteTarget(null);
  }, [deleteTarget, removeSession]);

  const handleOpenSingleDelete = useCallback((session: Session) => {
    setDeleteTarget({ type: 'single', session });
  }, []);

  const sharedSectionProps: Pick<
    SessionSectionProps,
    | 'allSessions'
    | 'searchQuery'
    | 'searchMatches'
    | 'updateOrder'
    | 'renameSession'
    | 'onOpenRestoreWizard'
    | 'onOpenEditDialog'
    | 'onOpenDeleteDialog'
    | 'onRestoreCurrentWindow'
    | 'onRestoreNewWindow'
    | 'onReplaceCurrentWindow'
    | 'onPin'
    | 'onUnpin'
  > = {
    allSessions: sortedSessions,
    searchQuery,
    searchMatches: sessionSearchMatches,
    updateOrder,
    renameSession,
    onOpenRestoreWizard: setRestoreSession,
    onOpenEditDialog: setEditTarget,
    onOpenDeleteDialog: handleOpenSingleDelete,
    onRestoreCurrentWindow: handleRestoreCurrentWindow,
    onRestoreNewWindow: handleRestoreNewWindow,
    onReplaceCurrentWindow: handleReplaceCurrentWindow,
    onPin: handlePin,
    onUnpin: handleUnpin,
  };

  const deleteDialogTitle = deleteTarget?.type === 'bulk'
    ? getMessage('confirmDeleteSelectedSessions')
    : getMessage('confirmDelete');
  const singleDeleteName = deleteTarget?.type === 'single' ? deleteTarget.session.name : '';
  const deleteDialogDescription = deleteTarget?.type === 'bulk'
    ? getMessage('confirmDeleteSelectedSessionsDescription').replace(
      '{count}',
      String(deleteTarget.ids.length),
    )
    : getMessage('confirmDeleteSession').replace('{name}', singleDeleteName);

  return (
    <PageLayout
      titleKey="sessionsTab"
      descriptionKey="sessionsPageDescription"
      icon={Archive}
      syncSettings={syncSettings}
    >
      {() => (
        <Box data-testid="page-sessions">
          {/* Toolbar: Search + Actions (hidden when no sessions exist) */}
          {isLoaded && sessions.length > 0 && (
            <ListToolbar
              testId="page-sessions-toolbar"
              searchTestId="page-sessions-search"
              searchPlaceholder={getMessage('searchSessions')}
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              action={
                <Button
                  data-testid="page-sessions-btn-snapshot"
                  variant="solid"
                  size="2"
                  onClick={() => setSnapshotOpen(true)}
                  style={{ color: 'white' }}
                >
                  <Camera size={16} />
                  {getMessage('sessionSnapshotButton')}
                </Button>
              }
            />
          )}

          {/* Quick restore feedback */}
          {quickRestoreMessage && (
            <Callout.Root color="green" variant="soft" mb="3">
              <Callout.Icon>
                <CheckCircle size={16} />
              </Callout.Icon>
              <Callout.Text>{quickRestoreMessage}</Callout.Text>
            </Callout.Root>
          )}

          {!isLoaded && (
            <Text size="2" color="gray">
              {getMessage('loadingText')}
            </Text>
          )}
          {isLoaded && sessions.length === 0 && !searchQuery && (
            <EmptyState
              data-testid="page-sessions-empty"
              icon={Archive}
              title={getMessage('sessionsEmptyStateTitle')}
              description={getMessage('sessionsEmptyStateDescription')}
              actions={
                <Flex gap="2">
                  <Button
                    data-testid="page-sessions-btn-snapshot"
                    variant="soft"
                    onClick={() => setSnapshotOpen(true)}
                  >
                    <Camera size={14} />
                    {getMessage('sessionSnapshotButton')}
                  </Button>
                  <Button variant="soft" onClick={() => openImportSessions()}>
                    <Upload size={14} />
                    {getMessage('importSessionsButton')}
                  </Button>
                </Flex>
              }
            />
          )}
          {isLoaded && sessions.length > 0 && displayedSessions.length === 0 && searchQuery && (
            <EmptyState compact icon={Archive} message={getMessage('noSessionsFound')} />
          )}
          {isLoaded && displayedSessions.length > 0 && (
            <Flex data-testid="page-sessions-list" direction="column" gap="3">
              <SessionSection
                icon={Pin}
                titleKey="pinnedSessionsSection"
                emptyTitleKey="pinnedSessionsEmptyTitle"
                emptyDescriptionKey="pinnedSessionsEmptyDescription"
                isPinned={true}
                sessions={pinnedSessions}
                selectedIds={selectedPinnedIds}
                onSelectionChange={setSelectedPinnedIds}
                onBulkDeleteRequest={(ids) => setDeleteTarget({ type: 'bulk', scope: 'pinned', ids })}
                onBulkExportRequest={(ids) => setBulkExportIds(ids)}
                onBulkPinToggle={(ids) => handleBulkPinToggle(ids, false)}
                testIdSuffix="pinned"
                {...sharedSectionProps}
              />

              <Separator size="4" />

              <SessionSection
                icon={Archive}
                titleKey="sessionsSection"
                emptyTitleKey="unpinnedSessionsEmptyTitle"
                emptyDescriptionKey="unpinnedSessionsEmptyDescription"
                isPinned={false}
                sessions={unpinnedSessions}
                selectedIds={selectedUnpinnedIds}
                onSelectionChange={setSelectedUnpinnedIds}
                onBulkDeleteRequest={(ids) => setDeleteTarget({ type: 'bulk', scope: 'unpinned', ids })}
                onBulkExportRequest={(ids) => setBulkExportIds(ids)}
                onBulkPinToggle={(ids) => handleBulkPinToggle(ids, true)}
                testIdSuffix="unpinned"
                {...sharedSectionProps}
              />
            </Flex>
          )}

          <SnapshotWizard
            open={snapshotOpen}
            onOpenChange={(open) => {
              setSnapshotOpen(open);
              if (!open) {
                onSnapshotWizardOpenChange?.(false);
                onSnapshotGroupIdChange?.(null);
              }
            }}
            onSave={handleSaveSession}
            existingSessions={sessions}
            initialGroupId={snapshotGroupId ?? undefined}
          />

          <SessionEditDialog
            session={editTarget}
            open={editTarget !== null}
            onOpenChange={(isOpen) => {
              if (!isOpen) setEditTarget(null);
            }}
            onSave={handleSaveEditedSession}
            existingSessions={sessions}
          />

          <RestoreWizard
            open={restoreSession !== null}
            onOpenChange={isOpen => {
              if (!isOpen) setRestoreSession(null);
            }}
            session={restoreSession}
          />

          <ConfirmDialog
            open={deleteTarget !== null}
            onOpenChange={isOpen => {
              if (!isOpen) setDeleteTarget(null);
            }}
            onConfirm={handleDeleteConfirm}
            title={deleteDialogTitle}
            description={deleteDialogDescription}
            confirmLabel={getMessage('delete')}
            color="red"
          />

          <ExportSessionsWizard
            open={bulkExportIds != null}
            onOpenChange={(open) => { if (!open) setBulkExportIds(null); }}
            initialSelectedIds={bulkExportIds ?? undefined}
          />
        </Box>
      )}
    </PageLayout>
  );
}
