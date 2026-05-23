import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Box, Flex, Button, Text, Callout, Separator, Badge, SegmentedControl } from '@radix-ui/themes';
import { Camera, Archive, ArchiveRestore, CheckCircle, Pin, PinOff, Upload, Trash2, FileDown, Boxes, type LucideIcon } from 'lucide-react';
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
import type { SessionsSubTab } from '@/hooks/useDeepLinking';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useListNavigation } from '@/hooks/useListNavigation';
import { useImportExportWizards } from '@/contexts/ImportExportWizardsContext';
import { restoreSessionTabs, type RestoreTarget } from '@/utils/tabRestore';
import { updateSession } from '@/utils/sessionStorage';
import { showSuccessNotification } from '@/utils/notifications';
import { getActiveTabGroupId } from '@/utils/tabCapture';
import { browser } from 'wxt/browser';
import type { Session } from '@/types/session';
import type { SessionSearchMatch } from '@/utils/sessionUtils';
import type { AppSettings } from '@/types/syncSettings';

type BulkScope = 'pinned' | 'unpinned' | 'archived';

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
  /** Session id for which a deep-link requests the refresh wizard to open. */
  refreshSessionId?: string | null;
  /** Called to clear the refresh deep-link once consumed. */
  onRefreshSessionIdChange?: (id: string | null) => void;
  /** Currently selected sub-tab (active vs archived), driven by useDeepLinking. */
  sessionsTab?: SessionsSubTab;
  /** Called when the user switches sub-tabs, so the hash reflects the new tab. */
  onSessionsTabChange?: (tab: SessionsSubTab) => void;
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
  /** Logical bucket this section renders. Drives drag layout and reorder routing. */
  bucket: 'pinned' | 'active' | 'archived';
  /** Sessions displayed in this section (already filtered by search + split by bucket). */
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
  /** Open the refresh wizard for the session (captures current window state). */
  onRefresh: (session: Session) => void;
  /** Pin/unpin handlers shared with the page-level widget shortcuts. */
  onPin: (session: Session) => void;
  onUnpin: (session: Session) => void;
  /** Archive/unarchive single-card handlers. */
  onArchive: (session: Session) => void;
  onUnarchive: (session: Session) => void;
  /** Section-local bulk selection (independent between buckets). */
  selectedIds: Set<string>;
  onSelectionChange: (next: Set<string>) => void;
  onBulkDeleteRequest: (ids: string[]) => void;
  onBulkExportRequest: (ids: string[]) => void;
  /** Primary bulk action button for this section (pin/unpin, archive, unarchive). */
  bulkPrimary?: {
    testId: string;
    icon: LucideIcon;
    label: string;
    onClick: (ids: string[]) => void;
  };
  /** Suffix appended to bulk testIds (e.g. 'pinned' / 'unpinned' / 'archived'). */
  testIdSuffix: BulkScope;
}

function SessionSection({
  icon,
  titleKey,
  emptyTitleKey,
  emptyDescriptionKey,
  bucket,
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
  onArchive,
  onUnarchive,
  selectedIds,
  onSelectionChange,
  onBulkDeleteRequest,
  onBulkExportRequest,
  bulkPrimary,
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
      if (bucket === 'archived') {
        // Archived sessions never interleave with the other buckets; just persist the bucket order.
        const target = reordered !== source ? reordered : dragItems ?? sessions;
        void updateOrder(target);
      } else {
        const isPinned = bucket === 'pinned';
        const others = allSessions.filter(s => !!s.isPinned !== isPinned && !s.isArchived);
        const buildOrder = (section: Session[]) =>
          isPinned ? [...section, ...others] : [...others, ...section];
        if (reordered !== source) {
          void updateOrder(buildOrder(reordered));
        } else if (dragItems) {
          void updateOrder(buildOrder(dragItems));
        }
      }
    }
    setDragItems(null);
  }, [dragItems, sessions, allSessions, bucket, updateOrder]);

  const { handleNavigationKey } = useListNavigation(listRef, '[data-session-card]');

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
  const PrimaryIcon = bulkPrimary?.icon;
  return (
    <Box>
      <SectionHeader icon={icon} titleKey={titleKey} count={sessions.length} />
      <Box mt="3">
        {selectedIds.size > 0 && (
          <BulkActionsBar
            testId={`page-sessions-bulk-bar-${testIdSuffix}`}
            selectedCount={selectedIds.size}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            onSelectAll={handleSelectAll}
          >
            {bulkPrimary && PrimaryIcon && (
              <Button
                size="1"
                variant="ghost"
                data-testid={bulkPrimary.testId}
                onClick={() => bulkPrimary.onClick(Array.from(selectedIds))}
              >
                <PrimaryIcon size={14} />
                {bulkPrimary.label}
              </Button>
            )}
            <Button
              size="1"
              variant="ghost"
              data-testid={`page-sessions-bulk-btn-export-${testIdSuffix}`}
              onClick={() => onBulkExportRequest(Array.from(selectedIds))}
            >
              <FileDown size={14} />
              {getMessage('exportSelected')}
            </Button>
            <Button
              size="1"
              variant="ghost"
              color="red"
              data-testid={`page-sessions-bulk-btn-delete-${testIdSuffix}`}
              onClick={() => onBulkDeleteRequest(Array.from(selectedIds))}
            >
              <Trash2 size={14} />
              {getMessage('deleteSelected')}
            </Button>
          </BulkActionsBar>
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
            <Flex ref={listRef} direction="column" gap="3" pl="6">
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
                  onArchive={onArchive}
                  onUnarchive={onUnarchive}
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
  refreshSessionId,
  onRefreshSessionIdChange,
  sessionsTab = 'active',
  onSessionsTabChange,
}: SessionsPageProps) {
  const { openImportSessions } = useImportExportWizards();
  const [bulkExportIds, setBulkExportIds] = useState<string[] | null>(null);
  // Archives are loaded only when the archived tab is open or the export wizard is opened
  // (so the user can still export archived items even from the active tab).
  const includeArchived = sessionsTab === 'archived' || bulkExportIds != null;
  const {
    sessions,
    pinnedSessions: pinnedBucket,
    activeSessions: activeBucket,
    archivedSessions: archivedBucket,
    isLoaded,
    createSession,
    renameSession,
    removeSession,
    reload,
    updateOrder,
    archiveSession,
    unarchiveSession,
  } = useSessions({ includeArchived });
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
  const [refreshTarget, setRefreshTarget] = useState<Session | null>(null);
  const [refreshGroupId, setRefreshGroupId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<Session | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [selectedPinnedIds, setSelectedPinnedIds] = useState<Set<string>>(new Set());
  const [selectedUnpinnedIds, setSelectedUnpinnedIds] = useState<Set<string>>(new Set());
  const [selectedArchivedIds, setSelectedArchivedIds] = useState<Set<string>>(new Set());
  const [quickRestoreMessage, setQuickRestoreMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabChange = useCallback(
    (next: string) => {
      if (next !== 'active' && next !== 'archived') return;
      const tab = next as SessionsSubTab;
      onSessionsTabChange?.(tab);
      // Keep the URL hash in sync so back/forward and shareable links work.
      const nextHash = tab === 'archived' ? '#sessions?tab=archived' : '#sessions';
      if (window.location.hash !== nextHash) {
        window.location.hash = nextHash;
      }
      // Reset cross-tab selection state so a stale selection doesn't drive
      // the wrong BulkActionsBar after switching tabs.
      setSearchQuery('');
    },
    [onSessionsTabChange],
  );

  const handleOpenSnapshotWizard = useCallback(() => setSnapshotOpen(true), []);

  const handleOpenRefreshWizard = useCallback(async (session: Session) => {
    const groupId = await getActiveTabGroupId();
    setRefreshGroupId(groupId);
    setRefreshTarget(session);
  }, []);

  const handleRefreshTrigger = useCallback(
    (session: Session) => { void handleOpenRefreshWizard(session); },
    [handleOpenRefreshWizard],
  );

  const handleRefreshSession = useCallback(
    async (updatedSession: Session) => {
      await updateSession(updatedSession.id, {
        name: updatedSession.name,
        note: updatedSession.note,
        categoryId: updatedSession.categoryId,
        groups: updatedSession.groups,
        ungroupedTabs: updatedSession.ungroupedTabs,
      });
      await reload();
    },
    [reload],
  );

  // Deep-link: open the refresh wizard when a sessionId has been provided via
  // URL hash (e.g. from the popup's refresh action). The optional groupId is
  // consumed from snapshotGroupId (parsed by useDeepLinking).
  useEffect(() => {
    if (!refreshSessionId || !isLoaded) return;
    const found = sessions.find((s) => s.id === refreshSessionId);
    if (found) {
      setRefreshGroupId(snapshotGroupId ?? null);
      setRefreshTarget(found);
      onRefreshSessionIdChange?.(null);
      onSnapshotGroupIdChange?.(null);
    }
  }, [refreshSessionId, isLoaded, sessions, snapshotGroupId, onRefreshSessionIdChange, onSnapshotGroupIdChange]);

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

  const handleArchive = useCallback(async (session: Session) => {
    await archiveSession(session.id);
    await reload();
    void showSuccessNotification(
      getMessage('sessionArchivedNotificationTitle'),
      getMessage('sessionArchivedNotificationMessage', [session.name]),
    );
  }, [archiveSession, reload]);

  const handleUnarchive = useCallback(async (session: Session) => {
    await unarchiveSession(session.id);
    await reload();
    void showSuccessNotification(
      getMessage('sessionUnarchivedNotificationTitle'),
      getMessage('sessionUnarchivedNotificationMessage', [session.name]),
    );
  }, [unarchiveSession, reload]);

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
        if (!focused || focused.isArchived) return;
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

  // Deep search: name + group titles + tab titles + tab URLs
  const visibleBucket = sessionsTab === 'archived' ? archivedBucket : [...pinnedBucket, ...activeBucket];

  const sessionSearchMatches = useMemo<Map<string, SessionSearchMatch> | null>(() => {
    if (!searchQuery) return null;
    const term = foldAccents(searchQuery);
    const map = new Map<string, SessionSearchMatch>();
    for (const session of visibleBucket) {
      const match = matchSessionSearch(session, term);
      if (match) map.set(session.id, match);
    }
    return map;
  }, [visibleBucket, searchQuery]);

  const displayedSessions = useMemo(() => {
    if (!sessionSearchMatches) return visibleBucket;
    return visibleBucket.filter(s => sessionSearchMatches.has(s.id));
  }, [visibleBucket, sessionSearchMatches]);

  const { pinned: pinnedSessions, unpinned: unpinnedSessions } = useMemo(
    () => splitByPinned(displayedSessions),
    [displayedSessions],
  );

  // Cleanup: drop selected ids that are no longer in their section (deleted,
  // pinned/unpinned, archived, or filtered out by the search). Keeps the
  // master checkbox count in sync with what the user actually sees.
  useEffect(() => {
    setSelectedPinnedIds(prev => pruneSelection(prev, pinnedSessions));
  }, [pinnedSessions]);

  useEffect(() => {
    setSelectedUnpinnedIds(prev => pruneSelection(prev, unpinnedSessions));
  }, [unpinnedSessions]);

  useEffect(() => {
    setSelectedArchivedIds(prev => pruneSelection(prev, displayedSessions));
  }, [displayedSessions]);

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

  const handleBulkArchive = useCallback(async (ids: string[]) => {
    for (const id of ids) {
      await archiveSession(id);
    }
    await reload();
    setSelectedPinnedIds(new Set());
    setSelectedUnpinnedIds(new Set());
  }, [archiveSession, reload]);

  const handleBulkUnarchive = useCallback(async (ids: string[]) => {
    for (const id of ids) {
      await unarchiveSession(id);
    }
    await reload();
    setSelectedArchivedIds(new Set());
  }, [unarchiveSession, reload]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'single') {
      await removeSession(deleteTarget.session.id);
    } else {
      for (const id of deleteTarget.ids) {
        await removeSession(id);
      }
      if (deleteTarget.scope === 'pinned') setSelectedPinnedIds(new Set());
      else if (deleteTarget.scope === 'unpinned') setSelectedUnpinnedIds(new Set());
      else setSelectedArchivedIds(new Set());
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
    | 'onRefresh'
    | 'onPin'
    | 'onUnpin'
    | 'onArchive'
    | 'onUnarchive'
  > = {
    allSessions: sessions,
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
    onRefresh: handleRefreshTrigger,
    onPin: handlePin,
    onUnpin: handleUnpin,
    onArchive: handleArchive,
    onUnarchive: handleUnarchive,
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

  const archivedOnlyView = sessionsTab === 'archived';
  const totalForTab = archivedOnlyView ? archivedBucket.length : pinnedBucket.length + activeBucket.length;
  const hasAnyOverall = pinnedBucket.length + activeBucket.length + archivedBucket.length > 0;

  return (
    <PageLayout
      titleKey="sessionsTab"
      descriptionKey="sessionsPageDescription"
      descriptionOverride={archivedOnlyView ? getMessage('archivedSessionsPageDescription') : undefined}
      syncSettings={syncSettings}
    >
      {() => (
        <Box
          data-testid="page-sessions"
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          {/* Sub-tabs: Active vs Archived */}
          {isLoaded && hasAnyOverall && (
            <Box mb="3">
              <SegmentedControl.Root
                data-testid="page-sessions-tabs"
                value={sessionsTab}
                onValueChange={handleTabChange}
                size="2"
              >
                <SegmentedControl.Item value="active" data-testid="page-sessions-tab-active">
                  {getMessage('activeSessionsTab')}
                </SegmentedControl.Item>
                <SegmentedControl.Item value="archived" data-testid="page-sessions-tab-archived">
                  {getMessage('archivedSessionsTab')}
                </SegmentedControl.Item>
              </SegmentedControl.Root>
            </Box>
          )}

          {/* Toolbar: Search + Actions (hidden when no sessions exist) */}
          {isLoaded && totalForTab > 0 && (
            <ListToolbar
              testId="page-sessions-toolbar"
              searchTestId="page-sessions-search"
              searchPlaceholder={getMessage('searchSessions')}
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              action={
                !archivedOnlyView ? (
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
                ) : undefined
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

          <Box
            data-testid="page-sessions-scroll"
            style={{ flex: 1, overflow: 'auto', minHeight: 0 }}
          >
            {!isLoaded && (
              <Text size="2" color="gray">
                {getMessage('loadingText')}
              </Text>
            )}
            {isLoaded && !archivedOnlyView && pinnedBucket.length + activeBucket.length === 0 && !searchQuery && (
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
            {isLoaded && archivedOnlyView && archivedBucket.length === 0 && !searchQuery && (
              <EmptyState
                data-testid="page-sessions-archived-empty"
                icon={Boxes}
                title={getMessage('archivedSessionsEmptyTitle')}
                description={getMessage('archivedSessionsEmptyDescription')}
              />
            )}
            {isLoaded && totalForTab > 0 && displayedSessions.length === 0 && searchQuery && (
              <EmptyState compact icon={Archive} message={getMessage('noSessionsFound')} />
            )}
            {isLoaded && !archivedOnlyView && displayedSessions.length > 0 && (
              <Flex data-testid="page-sessions-list" direction="column" gap="3">
                <SessionSection
                  icon={Pin}
                  titleKey="pinnedSessionsSection"
                  emptyTitleKey="pinnedSessionsEmptyTitle"
                  emptyDescriptionKey="pinnedSessionsEmptyDescription"
                  bucket="pinned"
                  sessions={pinnedSessions}
                  selectedIds={selectedPinnedIds}
                  onSelectionChange={setSelectedPinnedIds}
                  onBulkDeleteRequest={(ids) => setDeleteTarget({ type: 'bulk', scope: 'pinned', ids })}
                  onBulkExportRequest={(ids) => setBulkExportIds(ids)}
                  bulkPrimary={{
                    testId: 'page-sessions-bulk-btn-unpin-pinned',
                    icon: PinOff,
                    label: getMessage('unpinSelected'),
                    onClick: (ids) => handleBulkPinToggle(ids, false),
                  }}
                  testIdSuffix="pinned"
                  {...sharedSectionProps}
                />

                <Separator size="4" />

                <SessionSection
                  icon={Archive}
                  titleKey="sessionsSection"
                  emptyTitleKey="unpinnedSessionsEmptyTitle"
                  emptyDescriptionKey="unpinnedSessionsEmptyDescription"
                  bucket="active"
                  sessions={unpinnedSessions}
                  selectedIds={selectedUnpinnedIds}
                  onSelectionChange={setSelectedUnpinnedIds}
                  onBulkDeleteRequest={(ids) => setDeleteTarget({ type: 'bulk', scope: 'unpinned', ids })}
                  onBulkExportRequest={(ids) => setBulkExportIds(ids)}
                  bulkPrimary={{
                    testId: 'page-sessions-bulk-btn-archive-unpinned',
                    icon: Archive,
                    label: getMessage('bulkArchiveAction'),
                    onClick: handleBulkArchive,
                  }}
                  testIdSuffix="unpinned"
                  {...sharedSectionProps}
                />
              </Flex>
            )}
            {isLoaded && archivedOnlyView && displayedSessions.length > 0 && (
              <Flex data-testid="page-sessions-archived-list" direction="column" gap="3">
                <SessionSection
                  icon={Boxes}
                  titleKey="archivedSessionsSection"
                  emptyTitleKey="archivedSessionsEmptyTitle"
                  emptyDescriptionKey="archivedSessionsEmptyDescription"
                  bucket="archived"
                  sessions={displayedSessions}
                  selectedIds={selectedArchivedIds}
                  onSelectionChange={setSelectedArchivedIds}
                  onBulkDeleteRequest={(ids) => setDeleteTarget({ type: 'bulk', scope: 'archived', ids })}
                  onBulkExportRequest={(ids) => setBulkExportIds(ids)}
                  bulkPrimary={{
                    testId: 'page-sessions-bulk-btn-unarchive-archived',
                    icon: ArchiveRestore,
                    label: getMessage('bulkUnarchiveAction'),
                    onClick: handleBulkUnarchive,
                  }}
                  testIdSuffix="archived"
                  {...sharedSectionProps}
                />
              </Flex>
            )}
          </Box>

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

          <SnapshotWizard
            open={refreshTarget !== null}
            onOpenChange={(open) => {
              if (!open) {
                setRefreshTarget(null);
                setRefreshGroupId(null);
              }
            }}
            onSave={async () => { /* unused in refresh mode */ }}
            onRefresh={handleRefreshSession}
            refreshSession={refreshTarget ?? undefined}
            initialGroupId={refreshGroupId ?? undefined}
            existingSessions={sessions}
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
