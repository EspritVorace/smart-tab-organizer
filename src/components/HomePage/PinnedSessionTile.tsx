import type { KeyboardEvent } from 'react';
import { Box, Card, Flex, Text } from '@radix-ui/themes';
import { Pin } from 'lucide-react';
import type { Session } from '@/types/session';
import { SessionRestoreButton } from '@/components/Core/Session/SessionRestoreButton/SessionRestoreButton';
import { getMessage } from '@/utils/i18n';
import { markDiscovered } from '@/exploration/progressStore';
import type { DefaultRestoreActionValue } from '@/schemas/enums';
import type { HomeRestoreTarget } from './types';
import styles from './PinnedSessionsSection.module.css';

export interface PinnedSessionTileProps {
  session: Session;
  onRestore: (session: Session, target: HomeRestoreTarget) => void;
  /** Action triggered by the primary Restore button click. */
  defaultRestoreAction?: DefaultRestoreActionValue;
  /** Persists a new default action when the user picks it from the dropdown radio group. */
  onDefaultRestoreActionChange?: (value: DefaultRestoreActionValue) => void;
  tabIndex?: number;
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
  onFocus?: () => void;
}


function getCounts(session: Session): { groups: number; tabs: number } {
  const groups = session.groups.length;
  const grouped = session.groups.reduce((acc, g) => acc + g.tabs.length, 0);
  return { groups, tabs: grouped + session.ungroupedTabs.length };
}

export function PinnedSessionTile({
  session,
  onRestore,
  defaultRestoreAction = 'current',
  onDefaultRestoreActionChange,
  tabIndex = 0,
  onKeyDown,
  onFocus,
}: PinnedSessionTileProps) {
  const { groups, tabs } = getCounts(session);
  // Exploration: restoring straight from a pinned-profile Home tile.
  const handleRestore = (s: Session, target: HomeRestoreTarget) => {
    void markDiscovered('settings.restoreFromTile');
    onRestore(s, target);
  };

  return (
    <Card
      className={styles.tile}
      data-testid={`home-pinned-tile-${session.id}`}
      data-home-pinned-tile=""
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      aria-label={getMessage('homepagePinnedSessionsTileAriaLabel', [session.name])}
    >
      <Flex direction="column" gap="2" height="100%">
        <Flex align="center" gap="2">
          <Text size="2" weight="medium" truncate className={styles.name}>
            {session.name}
          </Text>
          <Pin size={14} aria-hidden="true" style={{ color: 'var(--accent-9)', flexShrink: 0 }} />
        </Flex>
        <Text size="1" color="gray">
          {getMessage('homepagePinnedSessionsTileMeta', [String(groups), String(tabs)])}
        </Text>
        <Box mt="auto">
          <SessionRestoreButton
            session={session}
            onRestoreCurrentWindow={(s) => handleRestore(s, 'current')}
            onRestoreNewWindow={(s) => handleRestore(s, 'new')}
            onReplaceCurrentWindow={(s) => handleRestore(s, 'replace')}
            onCustomize={(s) => handleRestore(s, 'custom')}
            onRefresh={(s) => handleRestore(s, 'refresh')}
            defaultRestoreAction={defaultRestoreAction}
            onDefaultRestoreActionChange={onDefaultRestoreActionChange}
            presentation="tile"
            size="2"
            data-testid={`home-pinned-tile-restore-${session.id}`}
          />
        </Box>
      </Flex>
    </Card>
  );
}
