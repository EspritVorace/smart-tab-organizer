import { Badge, Box, Button, Card, Flex, Grid, Heading } from '@radix-ui/themes';
import { Pin } from 'lucide-react';
import type { Session } from '@/types/session';
import { IconBox } from '@/components/UI/IconBox/IconBox';
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
  if (sessions.length === 0) return null;
  const visible = sessions.slice(0, MAX_TILES);

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
          <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="3">
            {visible.map((s) => (
              <PinnedSessionTile key={s.id} session={s} onRestore={onRestore} />
            ))}
          </Grid>
        </Flex>
      </section>
    </Card>
  );
}
