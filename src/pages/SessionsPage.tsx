import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Box, Flex, Button, Text, Callout, TextField } from '@radix-ui/themes';
import { Camera, Archive, CheckCircle, Pin, Search } from 'lucide-react';
import { DragDropProvider, type DragOverEvent, type DragEndEvent } from '@dnd-kit/react';
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { move } from '@dnd-kit/helpers';
import { PageLayout } from '../components/UI/PageLayout/PageLayout';
import { SessionCard } from '../components/Core/Session/SessionCard';
import { SessionEditDialog } from '../components/Core/Session/SessionEditDialog';
import { SessionsIntroCallout } from '../components/Core/Session/SessionsIntroCallout';
import { SnapshotWizard } from '../components/UI/SessionWizards/SnapshotWizard';
import { RestoreWizard } from '../components/UI/SessionWizards/RestoreWizard';
import { ConfirmDialog } from '../components/UI/ConfirmDialog/ConfirmDialog';
import { getMessage } from '../utils/i18n';
import { foldAccents } from '../utils/stringUtils';
import { matchSessionSearch } from '../utils/sessionUtils';
import { moveToFirst, moveToLast, applyDragReorder, assignPositions, getPositionForNewSession } from '../utils/sessionOrderUtils';
import { useSessions } from '../hooks/useSessions';
import { restoreTabs } from '../utils/tabRestore';
import { updateSession } from '../utils/sessionStorage';
import type { Session } from '../types/session';
import type { SessionSearchMatch } from '../utils/sessionUtils';
import type { SyncSettings } from '../types/syncSettings';

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

export function SessionsPage({
  syncSettings,
  snapshotWizardOpen = false,
  onSnapshotWizardOpenChange,
  snapshotGroupId,
  onSnapshotGroupIdChange,
}: SessionsPageProps) {
  const { sessions, isLoaded, createSession, renameSession, removeSession, reload } = useSessions();
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
  const [dragItems, setDragItems] = useState<Session[] | null>(null);

  // Sort: by position field (assign positions to sessions that don't have one yet)
  const sortedSessions = useMemo(() => {
    const sessionsWithPosition = assignPositions(sessions);
    return [...sessionsWithPosition].sort((a, b) => {
      const posA = a.position ?? 0;
      const posB = b.position ?? 0;
      return posA - posB;
    });
  }, [sessions]);

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

  // Quick restore in current window (no wizard)
  const handleRestoreCurrentWindow = useCallback(async (session: Session) => {
    try {
      const result = await restoreTabs({
        tabs: session.ungroupedTabs,
        groups: session.groups,
        target: 'current',
      });
      setQuickRestoreMessage(
        getMessage('restoreResultTabsCreated', [String(result.tabsCreated)]),
      );
      setTimeout(() => setQuickRestoreMessage(null), 4000);
    } catch {
      setQuickRestoreMessage(getMessage('restoreError'));
      setTimeout(() => setQuickRestoreMessage(null), 4000);
    }
  }, []);

  // Quick restore in new window (no wizard)
  const handleRestoreNewWindow = useCallback(async (session: Session) => {
    try {
      const result = await restoreTabs({
        tabs: session.ungroupedTabs,
        groups: session.groups,
        target: 'new',
      });
      setQuickRestoreMessage(
        getMessage('restoreResultTabsCreated', [String(result.tabsCreated)]),
      );
      setTimeout(() => setQuickRestoreMessage(null), 4000);
    } catch {
      setQuickRestoreMessage(getMessage('restoreError'));
      setTimeout(() => setQuickRestoreMessage(null), 4000);
    }
  }, []);

  const handlePin = useCallback(async (session: Session) => {
    await updateSession(session.id, { isPinned: true });
    await reload();
  }, [reload]);

  const handleUnpin = useCallback(async (session: Session) => {
    await updateSession(session.id, { isPinned: false });
    await reload();
  }, [reload]);

  // Drag-and-drop handlers
  const handleDragOver = useCallback((event: Parameters<DragOverEvent>[0]) => {
    setDragItems(prev => move(prev ?? sortedSessions, event));
  }, [sortedSessions]);

  const handleDragEnd = useCallback((event: Parameters<DragEndEvent>[0]) => {
    if (!event.canceled) {
      const reordered = move(dragItems ?? sortedSessions, event);
      if (reordered !== (dragItems ?? sortedSessions)) {
        // Persist all sessions with updated positions
        void Promise.all(
          reordered.map(s => updateSession(s.id, { position: s.position }))
        ).then(() => reload());
      } else if (dragItems) {
        void reload();
      }
    }
    setDragItems(null);
  }, [dragItems, sortedSessions, reload]);

  const handleMoveToFirst = useCallback((session: Session) => {
    const reordered = moveToFirst(sortedSessions, session.id);
    void Promise.all(
      reordered.map(s => updateSession(s.id, { position: s.position }))
    ).then(() => reload());
  }, [sortedSessions, reload]);

  const handleMoveLast = useCallback((session: Session) => {
    const reordered = moveToLast(sortedSessions, session.id);
    void Promise.all(
      reordered.map(s => updateSession(s.id, { position: s.position }))
    ).then(() => reload());
  }, [sortedSessions, reload]);

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

          {/* Toolbar: Search + Actions */}
          <Flex data-testid="page-sessions-toolbar" gap="3" mb="4" align="center">
            <Box style={{ flex: 1 }}>
              <TextField.Root
                data-testid="page-sessions-search"
                placeholder={getMessage('searchSessions')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              >
                <TextField.Slot>
                  <Search size={16} aria-hidden="true" />
                </TextField.Slot>
              </TextField.Root>
            </Box>
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
          </Flex>

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
          ) : displayedSessions.length === 0 ? (
            sessions.length === 0 && !searchQuery ? (
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
                <Button variant="soft" onClick={() => setSnapshotOpen(true)}>
                  <Camera size={14} aria-hidden="true" />
                  {getMessage('sessionSnapshotButton')}
                </Button>
              </Flex>
            ) : (
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
            )
          ) : (
            <DragDropProvider
              modifiers={[RestrictToVerticalAxis]}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <Flex data-testid="page-sessions-list" direction="column" gap="3">
                {(dragItems ?? displayedSessions).map((session, index) => {
                  const searchMatch = sessionSearchMatches?.get(session.id);
                  return (
                    <SessionCard
                      key={session.id}
                      session={session}
                      existingSessions={sessions}
                      onRestore={s => setRestoreSession(s)}
                      onRestoreCurrentWindow={handleRestoreCurrentWindow}
                      onRestoreNewWindow={handleRestoreNewWindow}
                      onRename={renameSession}
                      onEdit={s => setEditTarget(s)}
                      onDelete={s => setDeleteTarget(s)}
                      onPin={handlePin}
                      onUnpin={handleUnpin}
                      forcePreviewOpen={searchMatch?.matchesTabs === true || searchMatch?.matchesNote === true}
                      searchMatchingGroupIds={searchMatch?.matchingGroupIds}
                      searchQuery={searchQuery || undefined}
                      index={index}
                      isDragDisabled={!!searchQuery}
                      onMoveToFirst={() => handleMoveToFirst(session)}
                      onMoveLast={() => handleMoveLast(session)}
                    />
                  );
                })}
              </Flex>
            </DragDropProvider>
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
