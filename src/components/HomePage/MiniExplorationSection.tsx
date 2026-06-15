import { Box, Card, Flex, Progress, Text } from '@radix-ui/themes';
import { ArrowRight } from 'lucide-react';
import { IconBox } from '@/components/UI/IconBox/IconBox.js';
import { EXPLORATION_ICON } from '@/components/Core/Exploration/explorationUi.js';
import { getMessage, type MessageKey } from '@/utils/i18n.js';
import type { CoverageSummary } from '@/exploration/coverage.js';
import styles from './MiniExplorationSection.module.css';

export interface MiniExplorationSectionProps {
  coverage: CoverageSummary;
  onOpen: () => void;
}

/**
 * Compact exploration widget for the HomePage, sibling of MiniStatsSection:
 * global coverage percentage, the named current phase, a thin progress bar, and
 * a link to the full catalogue. No reward wording, no celebration.
 */
export function MiniExplorationSection({ coverage, onOpen }: MiniExplorationSectionProps) {
  const phaseLabel = getMessage(coverage.phase.labelKey as MessageKey);
  return (
    <Box asChild>
      <section aria-label={getMessage('explorationMiniTitle')} data-testid="home-mini-exploration">
        <button type="button" className={styles.button} onClick={onOpen} data-testid="home-mini-exploration-open">
          <Card className={styles.card}>
            <Flex direction="column" gap="2">
              <Flex align="center" gap="2">
                <IconBox icon={EXPLORATION_ICON} size="sm" variant="soft" />
                <Text as="span" size="2" weight="medium">
                  {getMessage('explorationMiniTitle')}
                </Text>
              </Flex>
              <Flex align="baseline" gap="2">
                <Text as="span" size="7" weight="bold" className={styles.percent}>
                  {coverage.percent} %
                </Text>
                <Text as="span" size="2" color="gray">
                  {getMessage('explorationMiniPhase', [phaseLabel])}
                </Text>
              </Flex>
              <Progress value={coverage.percent} size="1" aria-hidden="true" />
              <Flex align="center" gap="1" className={styles.link}>
                <Text as="span" size="1">{getMessage('explorationMiniLink')}</Text>
                <ArrowRight size={13} aria-hidden="true" />
              </Flex>
            </Flex>
          </Card>
        </button>
      </section>
    </Box>
  );
}
