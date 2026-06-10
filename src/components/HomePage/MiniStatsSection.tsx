import { Box, Card, Flex, Grid, Text } from '@radix-ui/themes';
import { Group, Copy, Archive } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { IconBox } from '@/components/UI/IconBox/IconBox';
import { getMessage, type MessageKey } from '@/utils/i18n';
import styles from './MiniStatsSection.module.css';

export type MiniStatRoute = 'stats' | 'sessions';

export interface MiniStatsValues {
  groups: number;
  dedup: number;
  sessions: number;
}

export interface MiniStatsSectionProps {
  stats: MiniStatsValues;
  onNavigate: (route: MiniStatRoute) => void;
  /** Locale used for thousand-separator formatting. Default: 'fr-FR'. */
  locale?: string;
}

interface StatItem {
  id: 'groups' | 'dedup' | 'sessions';
  icon: LucideIcon;
  labelKey: string;
  value: number;
  route: MiniStatRoute;
}

export function MiniStatsSection({ stats, onNavigate, locale = 'fr-FR' }: MiniStatsSectionProps) {
  const items: StatItem[] = [
    { id: 'groups',   icon: Group,   labelKey: 'homepageMiniStatsGroups',   value: stats.groups,   route: 'stats' },
    { id: 'dedup',    icon: Copy,    labelKey: 'homepageMiniStatsDedup',    value: stats.dedup,    route: 'stats' },
    { id: 'sessions', icon: Archive, labelKey: 'homepageMiniStatsSessions', value: stats.sessions, route: 'sessions' },
  ];

  return (
    <Box asChild>
      <section aria-label={getMessage('homepageMiniStatsAriaLabel')} data-testid="home-mini-stats">
        <Grid columns={{ initial: '1', sm: '3' }} gap="3">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              className={styles.statButton}
              onClick={() => onNavigate(it.route)}
              data-testid={`home-mini-stat-${it.id}`}
            >
              <Card className={styles.statCard}>
                <Flex direction="column" gap="1">
                  <Flex align="center" gap="2">
                    <IconBox icon={it.icon} size="sm" variant="soft" />
                    <Text as="span" size="1" color="gray">
                      {getMessage(it.labelKey as MessageKey)}
                    </Text>
                  </Flex>
                  <Text as="span" size="7" weight="bold" className={styles.value}>
                    {it.value.toLocaleString(locale)}
                  </Text>
                </Flex>
              </Card>
            </button>
          ))}
        </Grid>
      </section>
    </Box>
  );
}
