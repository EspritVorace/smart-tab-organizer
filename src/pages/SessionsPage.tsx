import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Box, Flex, Button, Text, Callout, Separator, Badge } from '@radix-ui/themes';
import { Camera, Archive, CheckCircle, Pin, type LucideIcon } from 'lucide-react';
import { DragDropProvider, type DragOverEvent, type DragEndEvent } from '@dnd-kit/react';
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { move } from '@dnd-kit/helpers';
import { PageLayout } from '@/components/UI/PageLayout/PageLayout';
import { SessionCard } from '@/components/Core/Session/SessionCard';
import { SessionEditDialog } from '@/components/Core/Session/SessionEditDialog';
import { SessionsIntroCallout } from '@/components/Core/Session/SessionsIntroCallout';
import { SnapshotWizard } from '@/components/UI/SessionWizards/SnapshotWizard';
import { RestoreWizard } from '@/components/UI/SessionWizards/RestoreWizard';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog/ConfirmDialog';
import { ListToolbar } from '@/components/UI/ListToolbar';
import { getMessage } from '@/utils/i18n';
import { foldAccents } from '@/utils/stringUtils';
import { matchSessionSearch, splitByPinned } from '@/utils/sessionUtils';
import { moveSessionToFirstInGroup, moveSessionToLastInGroup } from '@/utils/sessionOrderUtils';
import { useSessions } from '@/hooks/useSessions';
import { restoreSessionTabs } from '@/utils/tabRestore';
import { updateSession } from '@/utils/sessionStorage';
import type { Session } from '@/types/session';
import type { SessionSearchMatch } from '@/utils/sessionUtils';
import type { SyncSettings } from '@/types/syncSettings';

interface SessionsPageProps {
  syncSettings: SyncSettings;
  /** Controlled by options.tsx: true when a deep-link requests the snapshot wizard. */
  snapshotWizardOpen?: boolean;
  /** Called by SessionsPage to let options.tsx know the wizard closed (or page unmounted). */
  onSnapshotWizardOpenChange?: (open: boolean) => void;
  /** Chrome numeric groupId to pre-select in the snapshot wizard (null = all tabs). */
  snapshotGroupId?: number | null;
  /** Called when the snapshot wizard closes to reset the group context. */
  onSnapshotGroupIdChange?: (id: number | null) => void;
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
  emptyMessageKey: string;
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
  /** Reload sessions after a mutation (used for pin/unpin). */
  reload: () => Promise<void>;
  /** Open the RestoreWizard (owned by the parent). */
  onOpenRestoreWizard: (session: Session) => void;
  /** Open the SessionEditDialog (owned by the parent). */
  onOpenEditDialog: (session: Session) => void;
  /** Open the delete ConfirmDialog (owned by the parent). */
  onOpenDeleteDialog: (session: Session) => void;
  /** Emit a transient feedback message (single callout shared between both sections). */
  onRestoreFeedback: (message: string | null) => void;
}

function SessionSection({
  icon,
  titleKey,
  emptyMessageKey,
  isPinned,
  sessions,
  allSessions,
  searchQuery,
  searchMatches,
  updateOrder,
  renameSession,
  reload,
  onOpenRestoreWizard,
  onOpenEditDialog,
  onOpenDeleteDialog,
  onRestoreFeedback,
}: SessionSectionProps) {
  const [dragItems, setDragItems] = useState<Session[] | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleCardKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>, index: number) => {
    // Only act when the card element itself has focus (not a child input/button).
    if (e.target !== e.currentTarget) return;
    const cards = listRef.current?.querySelectorAll<HTMLElement>('[data-session-card]');
    if (!cards) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        cards[index + 1]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        cards[index - 1]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        cards[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        cards[cards.length - 1]?.focus();
        break;
    }
  }, []);

  // Drag: reorder within this section, then splice back into the global order.
  const handleDragOver = useCallback((event: Parameters<DragOverEvent>[0]) => {
    setDragItems(prev => move(prev ?? sessions, event));
  }, [sessions]);

  const handleDragEnd = useCallback((event: Parameters<DragEndEvent>[0]) => {
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

  // Quick restore: full session content, no conflict resolution wizard.
  const handleQuickRestore = useCallback(async (session: Session, target: 'current' | 'new') => {
    try {
      const result = await restoreSessionTabs(session, target);
      onRestoreFeedback(getMessage('restoreResultTabsCreated', [String(result.tabsCreated)]));
    } catch {
      onRestoreFeedback(getMessage('restoreError'));
    }
    setTimeout(() => onRestoreFeedback(null), 4000);
  }, [onRestoreFeedback]);

  const handleRestoreCurrentWindow = useCallback(
    (session: Session) => handleQuickRestore(session, 'current'),
    [handleQuickRestore],
  );

  const handleRestoreNewWindow = useCallback(
    (session: Session) => handleQuickRestore(session, 'new'),
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

  const handleMoveToFirst = useCallback((session: Session) => {
    void updateOrder(moveSessionToFirstInGroup(allSessions, session.id));
  }, [allSessions, updateOrder]);

  const handleMoveLast = useCallback((session: Session) => {
    void updateOrder(moveSessionToLastInGroup(allSessions, session.id));
  }, [allSessions, updateOrder]);

  // When a search is active, hide the whole section if it matched nothing.
  if (sessions.length === 0 && searchQuery) return null;
  return (
    <Box>
      <SectionHeader icon={icon} titleKey={titleKey} count={sessions.length} />
      {sessions.length === 0 ? (
        <Text size="2" color="gray" mt="2">{getMessage(emptyMessageKey)}</Text>
      ) : (
        <DragDropProvider
          modifiers={[RestrictToVerticalAxis]}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <Flex ref={listRef} direction="column" gap="3" mt="3">
            {(dragItems ?? sessions).map((session, index) => {
              const searchMatch = searchMatches?.get(session.id);
              return (
                <SessionCard
                  key={session.id}
                  session={session}
                  existingSessions={allSessions}
                  onRestore={onOpenRestoreWizard}
                  onRestoreCurrentWindow={handleRestoreCurrentWindow}
                  onRestoreNewWindow={handleRestoreNewWindow}
                  onRename={renameSession}
                  onEdit={onOpenEditDialog}
                  onDelete={onOpenDeleteDialog}
                  onPin={handlePin}
                  onUnpin={handleUnpin}
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
}: SessionsPageProps) {
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
  }, []);

  const [restoreSession, setRestoreSession] = useState<Session | null>(null);
  const [editTarget, setEditTarget] = useState<Session | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);
  const [quickRestoreMessage, setQuickRestoreMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    await removeSession(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, removeSession]);

  return (
    <PageLayout
      titleKey="sessionsTab"
      theme="SESSIONS"
      icon={Archive}
      syncSettings={syncSettings}
    >
      {() => (
        <Box data-testid="page-sessions">
          {/* Intro callout (dismissable) */}
          <SessionsIntroCallout />

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
                  <Camera size={16} aria-hidden="true" />
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

          {!isLoaded ? (
            <Text size="2" color="gray">
              {getMessage('loadingText')}
            </Text>
          ) : sessions.length === 0 && !searchQuery ? (
            // True empty state
            <Flex
              data-testid="page-sessions-empty"
              direction="column"
              align="center"
              justify="center"
              gap="3"
              style={{ minHeight: 200 }}
            >
              <Archive
                size={40}
                style={{ color: 'var(--gray-8)' }}
                aria-hidden="true"
              />
              <Text size="3" weight="medium" color="gray" align="center">
                {getMessage('sessionsEmptyStateTitle')}
              </Text>
              <Text size="2" color="gray" align="center" style={{ maxWidth: 340 }}>
                {getMessage('sessionsEmptyStateDescription')}
              </Text>
              <Button
                data-testid="page-sessions-btn-snapshot"
                variant="soft"
                onClick={() => setSnapshotOpen(true)}
              >
                <Camera size={14} aria-hidden="true" />
                {getMessage('sessionSnapshotButton')}
              </Button>
            </Flex>
          ) : displayedSessions.length === 0 && searchQuery ? (
            // Search no results
            <Flex
              direction="column"
              align="center"
              justify="center"
              gap="2"
              style={{ minHeight: 120 }}
            >
              <Archive size={32} style={{ color: 'var(--gray-8)' }} aria-hidden="true" />
              <Text color="gray">{getMessage('noSessionsFound')}</Text>
            </Flex>
          ) : (
            <Flex data-testid="page-sessions-list" direction="column" gap="3">
              <SessionSection
                icon={Pin}
                titleKey="pinnedSessionsSection"
                emptyMessageKey="pinnedSessionsEmpty"
                isPinned={true}
                sessions={pinnedSessions}
                allSessions={sortedSessions}
                searchQuery={searchQuery}
                searchMatches={sessionSearchMatches}
                updateOrder={updateOrder}
                renameSession={renameSession}
                reload={reload}
                onOpenRestoreWizard={setRestoreSession}
                onOpenEditDialog={setEditTarget}
                onOpenDeleteDialog={setDeleteTarget}
                onRestoreFeedback={setQuickRestoreMessage}
              />

              <Separator size="4" />

              <SessionSection
                icon={Archive}
                titleKey="sessionsSection"
                emptyMessageKey="unpinnedSessionsEmpty"
                isPinned={false}
                sessions={unpinnedSessions}
                allSessions={sortedSessions}
                searchQuery={searchQuery}
                searchMatches={sessionSearchMatches}
                updateOrder={updateOrder}
                renameSession={renameSession}
                reload={reload}
                onOpenRestoreWizard={setRestoreSession}
                onOpenEditDialog={setEditTarget}
                onOpenDeleteDialog={setDeleteTarget}
                onRestoreFeedback={setQuickRestoreMessage}
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
            title={getMessage('confirmDelete')}
            description={getMessage('confirmDeleteSession').replace(
              '{name}',
              deleteTarget?.name ?? '',
            )}
            confirmLabel={getMessage('delete')}
            color="red"
          />
        </Box>
      )}
    </PageLayout>
  );
}
