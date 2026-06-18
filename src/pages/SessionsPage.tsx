import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Box, Flex, Button, Text, Callout, Separator, Badge, TabNav, Kbd, Tooltip } from '@radix-ui/themes';
import { Camera, Archive, ArchiveRestore, CheckCircle, Pin, PinOff, Upload, Download, Trash2, FileDown, Boxes, type LucideIcon } from 'lucide-react';
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
import { ListToolbar, ListToolbarMenu } from '@/components/UI/ListToolbar';
import { BulkActionsBar } from '@/components/UI/BulkActionsBar';
import { ExportSessionsWizard } from '@/components/UI/ImportExportWizards/ExportSessionsWizard';
import { SessionViewMenu } from '@/components/UI/SessionViewMenu/SessionViewMenu';
import { getMessage, type MessageKey } from '@/utils/i18n';
import { foldAccents } from '@/utils/stringUtils';
import { matchSessionSearch, splitByPinned, getFocusedSessionFromDOM } from '@/utils/sessionUtils';
import { moveSessionToFirstInGroup, moveSessionToLastInGroup } from '@/utils/sessionOrderUtils';
import {
  computeSessionView,
  normalizeSessionViewState,
  DEFAULT_SESSION_VIEW_STATE,
  type SessionViewState,
} from '@/utils/sessionViewUtils';
import { getAllCategories } from '@/utils/categoriesStore';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext';
import { useSessions } from '@/hooks/useSessions';
import type { SessionsSubTab } from '@/hooks/useDeepLinking';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useListNavigation } from '@/hooks/useListNavigation';
import { useImportExportWizards } from '@/contexts/ImportExportWizardsContext';
import { restoreSessionTabs, type RestoreTarget } from '@/utils/tabRestore';
import { updateSession, type SessionBucket } from '@/utils/sessionStorage';
import { showSuccessNotification } from '@/utils/notifications';
import { markDiscovered } from '@/exploration/progressStore';
import { getActiveTabGroupId } from '@/utils/tabCapture';
import { browser } from 'wxt/browser';
import type { Session } from '@/types/session';
import type { SessionSearchMatch } from '@/utils/sessionUtils';
import type { AppSettings } from '@/types/syncSettings';
import type { DefaultRestoreActionValue } from '@/schemas/enums';

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
  /** Persist a partial settings update (for example the default restore action). */
  updateSettings: (updates: Partial<AppSettings>) => void;
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

function SectionHeader({
  icon: Icon,
  titleKey,
  count,
  action,
}: {
  icon: LucideIcon;
  titleKey: string;
  count: number;
  /** Optional control rendered on the right of the header (e.g. the filter/sort menu). */
  action?: React.ReactNode;
}) {
  return (
    <Flex align="center" gap="2">
      <Icon size={16} aria-hidden="true" style={{ color: 'var(--accent-9)' }} />
      <Text size="3" weight="bold">{getMessage(titleKey as MessageKey)}</Text>
      <Badge variant="soft" size="1">{count}</Badge>
      {action && <Box style={{ marginLeft: 'auto' }}>{action}</Box>}
    </Flex>
  );
}

interface SessionSectionProps {
  icon: LucideIcon;
  titleKey: string;
  emptyTitleKey: string;
  emptyDescriptionKey?: string;
  /** Logical bucket this section renders. Drives drag layout and reorder routing. */
  bucket: SessionBucket;
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
  /** Action triggered by the primary Restore button click. */
  defaultRestoreAction: DefaultRestoreActionValue;
  /** Persists a new default restore action when the user picks it from the dropdown radio group. */
  onDefaultRestoreActionChange: (value: DefaultRestoreActionValue) => void;
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
  /**
   * Section-specific bulk action buttons. Each renders inside the
   * BulkActionsBar before the shared Export/Delete buttons. Order matters:
   * the first action is visually the primary one (e.g. archive in the
   * active section, unarchive in the archived section).
   */
  bulkExtraActions?: ReadonlyArray<{
    testId: string;
    icon: LucideIcon;
    label: string;
    onClick: (ids: string[]) => void;
  }>;
  /** Suffix appended to bulk testIds (e.g. 'pinned' / 'unpinned' / 'archived'). */
  testIdSuffix: BulkScope;
  /**
   * Filter/sort view state for this section. When provided, the section header
   * renders a SessionViewMenu on the right. Omitted for the pinned section.
   */
  viewState?: SessionViewState;
  onViewChange?: (next: SessionViewState) => void;
  /**
   * Whether drag-and-drop reordering is allowed. Defaults to true. False when a
   * non-manual sort or a category filter is active (display order differs from
   * the real order), in addition to the existing search guard.
   */
  dndEnabled?: boolean;
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
  onRefresh,
  defaultRestoreAction,
  onDefaultRestoreActionChange,
  onPin,
  onUnpin,
  onArchive,
  onUnarchive,
  selectedIds,
  onSelectionChange,
  onBulkDeleteRequest,
  onBulkExportRequest,
  bulkExtraActions,
  testIdSuffix,
  viewState,
  onViewChange,
  dndEnabled = true,
}: SessionSectionProps) {
  const [dragItems, setDragItems] = useState<Session[] | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Drag is off during search, and whenever a non-manual sort or a category
  // filter is active (the displayed order no longer maps to the real order).
  const dragDisabled = !!searchQuery || !dndEnabled;

  // After a filter/sort change (menu close), move focus to the first resulting
  // card so a keyboard/screen-reader user lands on the first visible result.
  // Deferred so it runs after Radix restores focus to the menu trigger on close.
  const focusFirstCard = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLElement>('[data-session-card]')?.focus();
    });
  }, []);

  // Drag: reorder within this section, then splice back into the global order.
  const handleDragOver = useCallback((event: DragOverEvent) => {
    setDragItems(prev => move(prev ?? sessions, event));
  }, [sessions]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (!event.canceled) {
      void markDiscovered('sessions.reorder');
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
    if (checked) void markDiscovered('sessions.bulkSelect');
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    onSelectionChange(next);
  }, [selectedIds, onSelectionChange]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) void markDiscovered('sessions.bulkSelect');
    onSelectionChange(checked ? new Set(sessions.map(s => s.id)) : new Set());
  }, [sessions, onSelectionChange]);

  const isAllSelected = sessions.length > 0 && selectedIds.size === sessions.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < sessions.length;

  // When a search is active, hide the whole section if it matched nothing.
  if (sessions.length === 0 && searchQuery) return null;
  return (
    <Box>
      <SectionHeader
        icon={icon}
        titleKey={titleKey}
        count={sessions.length}
        action={
          viewState && onViewChange ? (
            <SessionViewMenu
              value={viewState}
              onChange={onViewChange}
              onApplied={focusFirstCard}
              categories={getAllCategories()}
              testIdPrefix={`page-sessions-view-${testIdSuffix}`}
            />
          ) : undefined
        }
      />
      <Box mt="3">
        {selectedIds.size > 0 && (
          <BulkActionsBar
            testId={`page-sessions-bulk-bar-${testIdSuffix}`}
            selectedCount={selectedIds.size}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            onSelectAll={handleSelectAll}
          >
            {(bulkExtraActions ?? []).map((action) => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={action.testId}
                  size="1"
                  variant="ghost"
                  data-testid={action.testId}
                  onClick={() => action.onClick(Array.from(selectedIds))}
                >
                  <ActionIcon size={14} />
                  {action.label}
                </Button>
              );
            })}
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
            title={getMessage(emptyTitleKey as MessageKey)}
            description={emptyDescriptionKey ? getMessage(emptyDescriptionKey as MessageKey) : undefined}
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
                  onRefresh={onRefresh}
                  defaultRestoreAction={defaultRestoreAction}
                  onDefaultRestoreActionChange={onDefaultRestoreActionChange}
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
                  isDragDisabled={dragDisabled}
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
  updateSettings,
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
  const { openImportSessions, openExportSessions } = useImportExportWizards();
  const { scopedItems } = useActiveWorkspaceContext();
  const [bulkExportIds, setBulkExportIds] = useState<string[] | null>(null);
  // Archives are watched continuously here: the PageUp/PageDown section
  // navigation needs to know whether an archived block exists (and reach its
  // first card) while the active sub-tab is showing. The cost is one extra
  // storage subscription on the options page; the rendered list stays driven
  // by `sessionsTab`, so nothing changes visually on the active tab.
  const includeArchived = true;
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

  // Exploration: opening the snapshot wizard is the discovery touchpoint for
  // `sessions.snapshot` (marked on display, never on save). Covers every entry
  // point that opens the wizard: the toolbar button, the empty-state CTA, the
  // keyboard shortcut, and the `#sessions?action=snapshot` deep link (popup or
  // exploration catalogue). Idempotent, so re-opening it costs nothing.
  useEffect(() => {
    if (snapshotOpen) void markDiscovered('sessions.snapshot');
  }, [snapshotOpen]);

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

  // Per-section filter/sort view state, persisted independently (workspace-scoped).
  const sessionsViewStateItem = scopedItems.sessionsViewStateItem;
  const archivedSessionsViewStateItem = scopedItems.archivedSessionsViewStateItem;
  const [normalViewState, setNormalViewState] = useState<SessionViewState>(DEFAULT_SESSION_VIEW_STATE);
  const [archivedViewState, setArchivedViewState] = useState<SessionViewState>(DEFAULT_SESSION_VIEW_STATE);
  // Tracks whether the persisted view (sort/filter) has been applied, so the
  // arrival autofocus waits for the sorted order instead of landing on the
  // first manual-order card and ending up stale once the sort kicks in.
  const [viewLoaded, setViewLoaded] = useState(false);

  useEffect(() => {
    let normalDone = false;
    let archivedDone = false;
    const settle = () => {
      if (normalDone && archivedDone) setViewLoaded(true);
    };
    sessionsViewStateItem.getValue().then(v => {
      setNormalViewState(normalizeSessionViewState(v));
      normalDone = true;
      settle();
    });
    archivedSessionsViewStateItem.getValue().then(v => {
      setArchivedViewState(normalizeSessionViewState(v));
      archivedDone = true;
      settle();
    });
  }, [sessionsViewStateItem, archivedSessionsViewStateItem]);

  const handleNormalViewChange = useCallback((next: SessionViewState) => {
    void markDiscovered('sessions.view.filterSort');
    setNormalViewState(next);
    sessionsViewStateItem.setValue(next).catch(() => {});
  }, [sessionsViewStateItem]);
  const handleArchivedViewChange = useCallback((next: SessionViewState) => {
    void markDiscovered('sessions.view.filterSort');
    setArchivedViewState(next);
    archivedSessionsViewStateItem.setValue(next).catch(() => {});
  }, [archivedSessionsViewStateItem]);
  // Section a pending PageUp/PageDown jump should land on once the (possibly
  // freshly switched) sub-tab has rendered its cards. Null when idle.
  const [pendingBucketFocus, setPendingBucketFocus] = useState<SessionBucket | null>(null);

  const handleTabChange = useCallback(
    (next: SessionsSubTab) => {
      onSessionsTabChange?.(next);
      // Keep the URL hash in sync so back/forward and shareable links work.
      const nextHash = next === 'archived' ? '#sessions/archived' : '#sessions';
      if (window.location.hash !== nextHash) {
        window.location.hash = nextHash;
      }
      // Reset cross-tab selection state so a stale selection doesn't drive
      // the wrong BulkActionsBar after switching tabs.
      setSearchQuery('');
    },
    [onSessionsTabChange],
  );

  // Manual sub-tab click: switch tabs, then mirror the initial-arrival
  // autofocus by landing on the first card of the newly shown sub-tab once it
  // has rendered. The page never remounts on a tab switch, so the
  // useListNavigation autofocus guard stays applied and would not re-fire on
  // its own; we drive the focus through the same deferred resolver
  // (`pendingBucketFocus`) the PageUp/PageDown jumps use. Section jumps keep
  // calling `handleTabChange` directly, so their section-specific targeting is
  // untouched.
  const handleTabClick = useCallback(
    (next: SessionsSubTab) => {
      if (next === 'archived') void markDiscovered('sessions.subtab.archived');
      const switching = next !== sessionsTab;
      handleTabChange(next);
      if (!switching) return;
      if (next === 'archived') {
        if (archivedBucket.length > 0) setPendingBucketFocus('archived');
      } else if (pinnedBucket.length > 0) {
        setPendingBucketFocus('pinned');
      } else if (activeBucket.length > 0) {
        setPendingBucketFocus('active');
      }
    },
    [sessionsTab, handleTabChange, archivedBucket.length, pinnedBucket.length, activeBucket.length],
  );

  const handleOpenSnapshotWizard = useCallback(() => setSnapshotOpen(true), []);

  const handleOpenRefreshWizard = useCallback(async (session: Session) => {
    void markDiscovered('sessions.refresh');
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
    void markDiscovered(`sessions.restore.${target}`);
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
    void markDiscovered('sessions.pin');
    await updateSession(session.id, { isPinned: true });
    await reload();
  }, [reload]);
  const handleUnpin = useCallback(async (session: Session) => {
    await updateSession(session.id, { isPinned: false });
    await reload();
  }, [reload]);

  const handleMoveToFirstFromPage = useCallback((session: Session) => {
    void updateOrder(moveSessionToFirstInGroup(sessions, session.id));
  }, [sessions, updateOrder]);

  const handleMoveToLastFromPage = useCallback((session: Session) => {
    void updateOrder(moveSessionToLastInGroup(sessions, session.id));
  }, [sessions, updateOrder]);

  const handleArchive = useCallback(async (session: Session) => {
    void markDiscovered('sessions.archive');
    await archiveSession(session.id);
    await reload();
    void showSuccessNotification(
      getMessage('sessionArchivedNotificationTitle'),
      getMessage('sessionArchivedNotificationMessage', [session.name]),
    );
  }, [archiveSession, reload]);

  const handleUnarchive = useCallback(async (session: Session) => {
    void markDiscovered('sessions.unarchive');
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
        if (focused) { void markDiscovered('sessions.restore.custom'); setRestoreSession(focused); }
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
      'sessionCard.refresh': () => {
        const focused = getFocusedSession();
        if (focused) handleRefreshTrigger(focused);
      },
      'sessionCard.edit': () => {
        const focused = getFocusedSession();
        if (focused) { void markDiscovered('sessions.editor'); setEditTarget(focused); }
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
      'sessionCard.moveToFirst': () => {
        const focused = getFocusedSession();
        if (focused) handleMoveToFirstFromPage(focused);
      },
      'sessionCard.moveToLast': () => {
        const focused = getFocusedSession();
        if (focused) handleMoveToLastFromPage(focused);
      },
      'sessionCard.archive': () => {
        const focused = getFocusedSession();
        if (!focused || focused.isArchived) return;
        handleArchive(focused).catch(() => {});
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
  const visibleBucket = useMemo<Session[]>(
    () => sessionsTab === 'archived' ? archivedBucket : [...pinnedBucket, ...activeBucket],
    [sessionsTab, pinnedBucket, activeBucket, archivedBucket],
  );

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

  // Apply the per-section filter/sort view on top of the search-filtered lists.
  const searchActive = searchQuery.length > 0;
  const normalView = useMemo(
    () => computeSessionView(unpinnedSessions, normalViewState, { searchActive }),
    [unpinnedSessions, normalViewState, searchActive],
  );
  const archivedView = useMemo(
    () => computeSessionView(displayedSessions, archivedViewState, { searchActive }),
    [displayedSessions, archivedViewState, searchActive],
  );
  const normalSessions = normalView.sessions;
  const archivedSessions = archivedView.sessions;

  // --- PageUp/PageDown navigation between session sections ---
  // Logical block order is pinned -> active -> archived. Archived lives on a
  // separate sub-tab, so a jump into/out of it switches tabs and defers the
  // focus to `pendingBucketFocus` (resolved by the effect below once rendered).
  const focusCardById = useCallback((id: string | undefined): boolean => {
    if (!id) return false;
    const el = document.querySelector<HTMLElement>(`[data-session-id="${CSS.escape(id)}"]`);
    if (!el) return false;
    el.focus();
    return true;
  }, []);

  // First focusable card id of a block. Same-tab blocks use the currently
  // displayed (search-filtered) arrays; cross-tab blocks use the raw buckets
  // (the search resets on tab switch).
  const firstIdForBucket = useCallback(
    (bucket: SessionBucket): string | undefined => {
      if (bucket === 'archived') {
        return (sessionsTab === 'archived' ? archivedSessions : archivedBucket)[0]?.id;
      }
      if (sessionsTab === 'active') {
        return (bucket === 'pinned' ? pinnedSessions : normalSessions)[0]?.id;
      }
      return (bucket === 'pinned' ? pinnedBucket : activeBucket)[0]?.id;
    },
    [sessionsTab, archivedSessions, archivedBucket, pinnedSessions, normalSessions, pinnedBucket, activeBucket],
  );

  const handleSectionJump = useCallback(
    (direction: 'next' | 'prev') => {
      const focused = getFocusedSession();
      if (!focused) return;
      const order: SessionBucket[] = ['pinned', 'active', 'archived'];
      let current: SessionBucket = 'active';
      if (focused.isArchived) current = 'archived';
      else if (focused.isPinned) current = 'pinned';
      const startIndex = order.indexOf(current);
      const candidates =
        direction === 'next'
          ? order.slice(startIndex + 1)
          : order.slice(0, startIndex).reverse();
      // Try the next/previous block, skipping empty ones; stop at the first hit.
      for (const bucket of candidates) {
        const firstId = firstIdForBucket(bucket);
        if (!firstId) continue;
        const targetTab: SessionsSubTab = bucket === 'archived' ? 'archived' : 'active';
        if (targetTab === sessionsTab) {
          focusCardById(firstId);
        } else {
          setPendingBucketFocus(bucket);
          handleTabChange(targetTab);
        }
        return;
      }
    },
    [getFocusedSession, firstIdForBucket, sessionsTab, focusCardById, handleTabChange],
  );

  useShortcuts(
    {
      'sessionCard.sectionNext': () => handleSectionJump('next'),
      'sessionCard.sectionPrev': () => handleSectionJump('prev'),
    },
    { scope: 'widget:session-card' },
  );

  // Resolve a deferred cross-tab jump: once the target sub-tab has loaded and
  // rendered its cards, focus the block's first card. Give up if the block
  // turned out empty after loading.
  useEffect(() => {
    if (!pendingBucketFocus || !isLoaded) return;
    const wantTab: SessionsSubTab = pendingBucketFocus === 'archived' ? 'archived' : 'active';
    if (sessionsTab !== wantTab) return;
    const firstId = firstIdForBucket(pendingBucketFocus);
    if (!firstId) {
      setPendingBucketFocus(null);
      return;
    }
    if (focusCardById(firstId)) setPendingBucketFocus(null);
  }, [pendingBucketFocus, isLoaded, sessionsTab, firstIdForBucket, focusCardById]);

  // Cleanup: drop selected ids that are no longer in their section (deleted,
  // pinned/unpinned, archived, or filtered out by the search). Keeps the
  // master checkbox count in sync with what the user actually sees.
  useEffect(() => {
    setSelectedPinnedIds(prev => pruneSelection(prev, pinnedSessions));
  }, [pinnedSessions]);

  useEffect(() => {
    setSelectedUnpinnedIds(prev => pruneSelection(prev, normalSessions));
  }, [normalSessions]);

  useEffect(() => {
    setSelectedArchivedIds(prev => pruneSelection(prev, archivedSessions));
  }, [archivedSessions]);

  const handleSaveSession = useCallback(
    async (session: Session) => {
      // Discovery of `sessions.snapshot` is marked when the wizard opens (see the
      // effect above), not here: opening the wizard is the touchpoint, saving is not.
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
    void markDiscovered('sessions.bulkActions');
    for (const id of ids) {
      await updateSession(id, { isPinned: makePinned });
    }
    await reload();
  }, [reload]);

  const handleBulkArchive = useCallback(async (ids: string[]) => {
    void markDiscovered('sessions.bulkActions');
    for (const id of ids) {
      await archiveSession(id);
    }
    await reload();
    setSelectedPinnedIds(new Set());
    setSelectedUnpinnedIds(new Set());
  }, [archiveSession, reload]);

  const handleBulkUnarchive = useCallback(async (ids: string[]) => {
    void markDiscovered('sessions.bulkActions');
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
    | 'defaultRestoreAction'
    | 'onDefaultRestoreActionChange'
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
    onOpenRestoreWizard: (session) => { void markDiscovered('sessions.restore.custom'); setRestoreSession(session); },
    onOpenEditDialog: (session) => { void markDiscovered('sessions.editor'); setEditTarget(session); },
    onOpenDeleteDialog: handleOpenSingleDelete,
    onRestoreCurrentWindow: handleRestoreCurrentWindow,
    onRestoreNewWindow: handleRestoreNewWindow,
    onReplaceCurrentWindow: handleReplaceCurrentWindow,
    onRefresh: handleRefreshTrigger,
    defaultRestoreAction: syncSettings.defaultRestoreAction,
    onDefaultRestoreActionChange: (value) => { void markDiscovered('sessions.defaultRestore'); updateSettings({ defaultRestoreAction: value }); },
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

  // Initial focus on arrival (active view): focus the first session card
  // (pinned section renders before unpinned, so the first card is pinned when
  // any), or fall back to the empty-state snapshot button when there is none.
  // This page-level instance is used only for the autofocus; per-section arrow
  // navigation keeps its own useListNavigation hooks.
  const sessionsListRef = useRef<HTMLDivElement>(null);
  useListNavigation(sessionsListRef, '[data-session-card]', {
    autoFocus: {
      // Wait for the persisted view so the focus lands on the first *sorted*
      // visible card, not the first manual-order one.
      ready: isLoaded && viewLoaded && !archivedOnlyView,
      fallbackSelector: '[data-testid="page-sessions-btn-snapshot"]',
    },
  });

  // Enter in the search field jumps to the first result card (works on both the
  // active and archived sub-tabs via the shared scroll container), or keeps
  // focus in the field when there is no result.
  const focusFirstResultCard = useCallback(() => {
    document
      .querySelector('[data-testid="page-sessions-scroll"]')
      ?.querySelector<HTMLElement>('[data-session-card]')
      ?.focus();
  }, []);

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
              <TabNav.Root data-testid="page-sessions-tabs">
                <TabNav.Link
                  href="#sessions"
                  active={sessionsTab === 'active'}
                  data-testid="page-sessions-tab-active"
                  onClick={(e) => { e.preventDefault(); handleTabClick('active'); }}
                >
                  {getMessage('activeSessionsTab')}
                </TabNav.Link>
                <TabNav.Link
                  href="#sessions/archived"
                  active={sessionsTab === 'archived'}
                  data-testid="page-sessions-tab-archived"
                  onClick={(e) => { e.preventDefault(); handleTabClick('archived'); }}
                >
                  {getMessage('archivedSessionsTab')}
                </TabNav.Link>
              </TabNav.Root>
            </Box>
          )}

          {/* Toolbar: Search + Actions (hidden when no sessions exist) */}
          {isLoaded && totalForTab > 0 && (
            <ListToolbar
              testId="page-sessions-toolbar"
              searchTestId="page-sessions-search"
              searchPlaceholder={getMessage('searchSessions')}
              searchValue={searchQuery}
              onSearchChange={(q) => { if (q) { void markDiscovered('sessions.search'); } setSearchQuery(q); }}
              onSearchSubmit={focusFirstResultCard}
              action={
                !archivedOnlyView ? (
                  <Tooltip content={<Flex align="center" gap="2" aria-hidden="true">{getMessage('sessionSnapshotButton')}<Kbd>N</Kbd></Flex>}>
                    <Button
                      data-testid="page-sessions-btn-snapshot"
                      variant="solid"
                      size="2"
                      onClick={() => setSnapshotOpen(true)}
                      style={{ color: 'white' }}
                      aria-keyshortcuts="N"
                    >
                      <Camera size={16} />
                      {getMessage('sessionSnapshotButton')}
                    </Button>
                  </Tooltip>
                ) : undefined
              }
              menu={
                <ListToolbarMenu
                  testId="page-sessions-toolbar-menu"
                  items={[
                    {
                      key: 'export',
                      testId: 'page-sessions-toolbar-menu-export',
                      icon: Download,
                      label: getMessage('exportSessionsTitle'),
                      onSelect: () => openExportSessions(),
                    },
                    {
                      key: 'import',
                      testId: 'page-sessions-toolbar-menu-import',
                      icon: Upload,
                      label: getMessage('importSessionsTitle'),
                      onSelect: () => openImportSessions(),
                    },
                  ]}
                />
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
            // Vertical scroll only: clip overflow-x so the Radix ghost buttons'
            // negative margins (card dropdowns) don't trigger a spurious
            // horizontal scrollbar (mirrors PageLayoutFrame's content box).
            style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}
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
              <Flex data-testid="page-sessions-list" direction="column" gap="3" ref={sessionsListRef}>
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
                  bulkExtraActions={[
                    {
                      testId: 'page-sessions-bulk-btn-unpin-pinned',
                      icon: PinOff,
                      label: getMessage('unpinSelected'),
                      onClick: (ids) => handleBulkPinToggle(ids, false),
                    },
                  ]}
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
                  sessions={normalSessions}
                  viewState={normalViewState}
                  onViewChange={handleNormalViewChange}
                  dndEnabled={normalView.isDndEnabled}
                  selectedIds={selectedUnpinnedIds}
                  onSelectionChange={setSelectedUnpinnedIds}
                  onBulkDeleteRequest={(ids) => setDeleteTarget({ type: 'bulk', scope: 'unpinned', ids })}
                  onBulkExportRequest={(ids) => setBulkExportIds(ids)}
                  bulkExtraActions={[
                    {
                      testId: 'page-sessions-bulk-btn-pin-unpinned',
                      icon: Pin,
                      label: getMessage('pinSelected'),
                      onClick: (ids) => handleBulkPinToggle(ids, true),
                    },
                    {
                      testId: 'page-sessions-bulk-btn-archive-unpinned',
                      icon: Archive,
                      label: getMessage('bulkArchiveAction'),
                      onClick: handleBulkArchive,
                    },
                  ]}
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
                  sessions={archivedSessions}
                  viewState={archivedViewState}
                  onViewChange={handleArchivedViewChange}
                  dndEnabled={archivedView.isDndEnabled}
                  selectedIds={selectedArchivedIds}
                  onSelectionChange={setSelectedArchivedIds}
                  onBulkDeleteRequest={(ids) => setDeleteTarget({ type: 'bulk', scope: 'archived', ids })}
                  onBulkExportRequest={(ids) => setBulkExportIds(ids)}
                  bulkExtraActions={[
                    {
                      testId: 'page-sessions-bulk-btn-unarchive-archived',
                      icon: ArchiveRestore,
                      label: getMessage('bulkUnarchiveAction'),
                      onClick: handleBulkUnarchive,
                    },
                  ]}
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
