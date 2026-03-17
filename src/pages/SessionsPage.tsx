import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Box, Flex, Button, Text, Callout, Tooltip, TextField } from '@radix-ui/themes';
import { Camera, Archive, CheckCircle, Pin, Search } from 'lucide-react';
import { PageLayout } from '../components/UI/PageLayout/PageLayout';
import { SessionCard } from '../components/Core/Session/SessionCard';
import { SessionEditDialog } from '../components/Core/Session/SessionEditDialog';
import { SessionsIntroCallout } from '../components/Core/Session/SessionsIntroCallout';
import { ProfileOnboardingDialog } from '../components/Core/Session/ProfileOnboardingDialog';
import { SnapshotWizard } from '../components/UI/SessionWizards/SnapshotWizard';
import { RestoreWizard } from '../components/UI/SessionWizards/RestoreWizard';
import { ConfirmDialog } from '../components/UI/ConfirmDialog/ConfirmDialog';
import { getMessage } from '../utils/i18n';
import { useSessions } from '../hooks/useSessions';
import { restoreTabs } from '../utils/tabRestore';
import { updateSession } from '../utils/sessionStorage';
import { removeProfileWindow } from '../utils/profileWindowMap';
import { getSessionsHelpPrefs, updateSessionsHelpPrefs } from '../utils/sessionsHelpPrefs';
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
  const [searchQuery, setSearchQuery] = useState('');

  // Onboarding state
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  // Pending action after onboarding: 'wizard' = open profile wizard, or a Session to pin
  const [pendingAfterOnboarding, setPendingAfterOnboarding] = useState<'wizard' | Session | null>(null);

  // Sort: profiles (isPinned) first by updatedAt desc, then snapshots by updatedAt desc
  const sortedSessions = useMemo(() => [...sessions].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  }), [sessions]);

  const displayedSessions = useMemo(() => {
    if (!searchQuery) return sortedSessions;
    const term = searchQuery.toLowerCase();
    return sortedSessions.filter(s => s.name.toLowerCase().includes(term));
  }, [sortedSessions, searchQuery]);

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

  /** Pin a session directly (after onboarding check). */
  const doPin = useCallback(async (session: Session) => {
    await updateSession(session.id, { isPinned: true });
    await reload();
  }, [reload]);

  /** Open profile wizard directly (after onboarding check). */
  const doOpenProfileWizard = useCallback(() => {
    setProfileWizardOpen(true);
  }, []);

  /**
   * Show the onboarding dialog the first time the user creates a profile,
   * then execute the pending action once they dismiss it.
   */
  const withOnboarding = useCallback(async (action: 'wizard' | Session) => {
    const prefs = await getSessionsHelpPrefs();
    if (!prefs.profileOnboardingShown) {
      setPendingAfterOnboarding(action);
      setOnboardingOpen(true);
    } else {
      if (action === 'wizard') doOpenProfileWizard();
      else await doPin(action);
    }
  }, [doOpenProfileWizard, doPin]);

  const handleOnboardingClose = useCallback(async () => {
    setOnboardingOpen(false);
    await updateSessionsHelpPrefs({ profileOnboardingShown: true });
    const pending = pendingAfterOnboarding;
    setPendingAfterOnboarding(null);
    if (pending === 'wizard') doOpenProfileWizard();
    else if (pending) await doPin(pending);
  }, [pendingAfterOnboarding, doOpenProfileWizard, doPin]);

  const handlePin = useCallback(async (session: Session) => {
    await withOnboarding(session);
  }, [withOnboarding]);

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
            <Tooltip content={getMessage('sessionNewProfileTooltip')}>
              <Button
                variant="soft"
                size="2"
                onClick={() => withOnboarding('wizard')}
              >
                <Pin size={16} aria-hidden="true" />
                {getMessage('sessionNewProfile')}
              </Button>
            </Tooltip>
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
                <Flex gap="2">
                  <Button variant="soft" onClick={() => setSnapshotOpen(true)}>
                    <Camera size={14} aria-hidden="true" />
                    {getMessage('sessionSnapshotButton')}
                  </Button>
                  <Button variant="soft" onClick={() => withOnboarding('wizard')}>
                    <Pin size={14} aria-hidden="true" />
                    {getMessage('sessionNewProfile')}
                  </Button>
                </Flex>
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

          <ProfileOnboardingDialog
            open={onboardingOpen}
            onClose={handleOnboardingClose}
          />

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
