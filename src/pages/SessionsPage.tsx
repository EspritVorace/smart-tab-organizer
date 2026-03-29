import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Box, Flex, Button, Text, Callout, TextField } from '@radix-ui/themes';
import { Camera, Archive, CheckCircle, Pin, Search } from 'lucide-react';
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
}

export function SessionsPage({
  syncSettings,
  snapshotWizardOpen = false,
  onSnapshotWizardOpenChange,
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

  // Sort: pinned first by updatedAt desc, then snapshots by updatedAt desc
  const sortedSessions = useMemo(() => [...sessions].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  }), [sessions]);

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


  return (
    <PageLayout
      titleKey="sessionsTab"
      theme="SESSIONS"
      icon={Archive}
      syncSettings={syncSettings}
    >
      {() => (
        <Box>
          {/* Intro callout (dismissable) */}
          <SessionsIntroCallout />

          {/* Toolbar: Search + Actions */}
          <Flex gap="3" mb="4" align="center">
            <Box style={{ flex: 1 }}>
              <TextField.Root
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
            <Flex direction="column" gap="3">
              {displayedSessions.map(session => {
                const searchMatch = sessionSearchMatches?.get(session.id);
                return (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onRestore={s => setRestoreSession(s)}
                    onRestoreCurrentWindow={handleRestoreCurrentWindow}
                    onRestoreNewWindow={handleRestoreNewWindow}
                    onRename={renameSession}
                    onEdit={s => setEditTarget(s)}
                    onDelete={s => setDeleteTarget(s)}
                    onPin={handlePin}
                    onUnpin={handleUnpin}
                    forcePreviewOpen={searchMatch?.matchesTabs === true}
                    searchMatchingGroupIds={searchMatch?.matchingGroupIds}
                  />
                );
              })}
            </Flex>
          )}

          <SnapshotWizard
            open={snapshotOpen}
            onOpenChange={(open) => {
              setSnapshotOpen(open);
              if (!open) onSnapshotWizardOpenChange?.(false);
            }}
            onSave={handleSaveSession}
          />

          <SessionEditDialog
            session={editTarget}
            open={editTarget !== null}
            onOpenChange={(isOpen) => {
              if (!isOpen) setEditTarget(null);
            }}
            onSave={handleSaveEditedSession}
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
