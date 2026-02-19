import React, { useState, useCallback, useEffect } from 'react';
import { Box, Flex, Button, Text, Callout } from '@radix-ui/themes';
import { Camera, Archive, CheckCircle, Pin } from 'lucide-react';
import { PageLayout } from '../components/UI/PageLayout/PageLayout';
import { SessionCard } from '../components/Core/Session/SessionCard';
import { SessionEditDialog } from '../components/Core/Session/SessionEditDialog';
import { SnapshotWizard } from '../components/UI/SessionWizards/SnapshotWizard';
import { RestoreWizard } from '../components/UI/SessionWizards/RestoreWizard';
import { ConfirmDialog } from '../components/UI/ConfirmDialog/ConfirmDialog';
import { getMessage } from '../utils/i18n';
import { useSessions } from '../hooks/useSessions';
import { restoreTabs } from '../utils/tabRestore';
import { updateSession } from '../utils/sessionStorage';
import { removeProfileWindow } from '../utils/profileWindowMap';
import type { Session, ProfileIcon } from '../types/session';
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
  const [profileWizardOpen, setProfileWizardOpen] = useState(false);

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

  // Sort: profiles (isPinned) first by updatedAt desc, then snapshots by updatedAt desc
  const displayedSessions = [...sessions].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

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
        updatedAt: updatedSession.updatedAt,
      });
      await reload();
    },
    [reload],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    await removeProfileWindow(deleteTarget.id);
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
    await removeProfileWindow(session.id);
    await updateSession(session.id, { isPinned: false, autoSync: false });
    await reload();
  }, [reload]);

  const handleChangeIcon = useCallback(async (session: Session, icon: ProfileIcon | undefined) => {
    await updateSession(session.id, { icon });
    await reload();
  }, [reload]);

  const handleToggleAutoSync = useCallback(async (session: Session, autoSync: boolean) => {
    await updateSession(session.id, { autoSync });
    await reload();
  }, [reload]);

  return (
    <PageLayout
      titleKey="sessionsTab"
      theme="SESSIONS"
      icon={Archive}
      syncSettings={syncSettings}
      headerActions={
        <Flex gap="2">
          <Button
            variant="soft"
            size="2"
            onClick={() => setProfileWizardOpen(true)}
          >
            <Pin size={16} aria-hidden="true" />
            {getMessage('sessionNewProfile')}
          </Button>
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
      }
    >
      {() => (
        <Box>
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
            // Empty state
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
              <Text size="3" color="gray" align="center">
                {getMessage('sessionsEmptyState')}
              </Text>
              <Button variant="soft" onClick={() => setSnapshotOpen(true)}>
                <Camera size={14} aria-hidden="true" />
                {getMessage('sessionSnapshotButton')}
              </Button>
            </Flex>
          ) : (
            <Flex direction="column" gap="3">
              {displayedSessions.map(session => (
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
                  onChangeIcon={handleChangeIcon}
                  onToggleAutoSync={handleToggleAutoSync}
                />
              ))}
            </Flex>
          )}

          <SnapshotWizard
            open={snapshotOpen}
            onOpenChange={(open) => {
              setSnapshotOpen(open);
              if (!open) onSnapshotWizardOpenChange?.(false);
            }}
            onSave={handleSaveSession}
            mode="snapshot"
          />

          <SnapshotWizard
            open={profileWizardOpen}
            onOpenChange={setProfileWizardOpen}
            onSave={handleSaveSession}
            mode="profile"
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
