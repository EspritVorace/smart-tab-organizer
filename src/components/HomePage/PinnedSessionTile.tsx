import type { KeyboardEvent } from 'react';
import { Box, Card, Flex, Text } from '@radix-ui/themes';
import { Pin, RotateCcw } from 'lucide-react';
import type { Session } from '@/types/session';
import { SplitButton } from '@/components/UI/SplitButton/SplitButton';
import { getMessage } from '@/utils/i18n';
import type { HomeRestoreTarget } from './types';
import styles from './PinnedSessionsSection.module.css';

export interface PinnedSessionTileProps {
  session: Session;
  onRestore: (session: Session, target: HomeRestoreTarget) => void;
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
  tabIndex = 0,
  onKeyDown,
  onFocus,
}: PinnedSessionTileProps) {
  const { groups, tabs } = getCounts(session);

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
          <SplitButton
            label={
              <Flex align="center" gap="1">
                <RotateCcw size={14} aria-hidden="true" />
                {getMessage('homepagePinnedSessionsRestore')}
              </Flex>
            }
            onClick={() => onRestore(session, 'current')}
            menuItems={[
              { label: getMessage('homepagePinnedSessionsRestoreCurrent'), onClick: () => onRestore(session, 'current') },
              { label: getMessage('homepagePinnedSessionsRestoreNew'), onClick: () => onRestore(session, 'new') },
              { label: getMessage('homepagePinnedSessionsRestoreReplace'), onClick: () => onRestore(session, 'replace') },
              { label: getMessage('homepagePinnedSessionsRestoreCustom'), onClick: () => onRestore(session, 'custom'), separator: true },
            ]}
            ariaLabel={getMessage('homepagePinnedSessionsRestoreOptions')}
            primaryAriaLabel={getMessage('homepagePinnedSessionsRestore')}
            size="2"
            data-testid={`home-pinned-tile-restore-${session.id}`}
          />
        </Box>
      </Flex>
    </Card>
  );
}
