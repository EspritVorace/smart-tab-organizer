import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import { Badge, Box, Button, Card, Flex, Grid, Heading } from '@radix-ui/themes';
import { Pin } from 'lucide-react';
import type { Session } from '@/types/session';
import { IconBox } from '@/components/UI/IconBox/IconBox';
import { useListNavigation } from '@/hooks/useListNavigation';
import { getMessage } from '@/utils/i18n';
import { PinnedSessionTile } from './PinnedSessionTile';
import type { HomeRestoreTarget } from './types';

export interface PinnedSessionsSectionProps {
  sessions: Session[];
  onSeeAll: () => void;
  onRestore: (session: Session, target: HomeRestoreTarget) => void;
}

const MAX_TILES = 6;

export function PinnedSessionsSection({ sessions, onSeeAll, onRestore }: PinnedSessionsSectionProps) {
  const visible = sessions.slice(0, MAX_TILES);
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const { handleNavigationKey } = useListNavigation(gridRef, '[data-home-pinned-tile]', {
    axis: 'horizontal',
    rovingTabIndex: true,
  });

  const handleTileKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>, index: number, session: Session) => {
      if (e.target !== e.currentTarget) return;
      if (handleNavigationKey(e, index)) return;
      if (e.ctrlKey || e.metaKey) return;
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        if (e.altKey && e.shiftKey) onRestore(session, 'new');
        else if (e.altKey) onRestore(session, 'replace');
        else if (e.shiftKey) onRestore(session, 'current');
        else onRestore(session, 'custom');
      }
    },
    [handleNavigationKey, onRestore],
  );

  if (visible.length === 0) return null;

  return (
    <Card asChild>
      <section aria-labelledby="home-pinned-heading" data-testid="home-pinned">
        <Flex direction="column" gap="3">
          <Flex align="center" gap="2">
            <IconBox icon={Pin} size="sm" variant="soft" />
            <Heading id="home-pinned-heading" as="h2" size="4" weight="bold">
              {getMessage('homepagePinnedSessionsTitle')}
            </Heading>
            <Badge color="gray" variant="soft">
              {sessions.length}
            </Badge>
            <Box flexGrow="1" />
            <Button variant="ghost" size="2" onClick={onSeeAll} data-testid="home-pinned-see-all">
              {getMessage('homepagePinnedSessionsSeeAll')}
            </Button>
          </Flex>
          <Grid ref={gridRef} columns={{ initial: '1', sm: '2', md: '3' }} gap="3">
            {visible.map((s, i) => (
              <PinnedSessionTile
                key={s.id}
                session={s}
                onRestore={onRestore}
                tabIndex={i === focusIndex ? 0 : -1}
                onFocus={() => setFocusIndex(i)}
                onKeyDown={(e) => handleTileKeyDown(e, i, s)}
              />
            ))}
          </Grid>
        </Flex>
      </section>
    </Card>
  );
}
