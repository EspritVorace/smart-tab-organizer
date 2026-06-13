import { Box, Card, Flex, Text } from '@radix-ui/themes';
import type { CoverageSummary } from '@/exploration/coverage.js';
import { getMessage, type MessageKey } from '@/utils/i18n.js';
import { PhaseBar } from './PhaseBar.js';
import styles from './Exploration.module.css';

interface ExplorationCoverageSummaryProps {
  coverage: CoverageSummary;
}

/**
 * Coverage summary card: the big global percentage on the left, the current
 * phase plus the phase bar on the right. Numbers use tabular-nums; the phase is
 * named, never a judgement on the person.
 */
export function ExplorationCoverageSummary({ coverage }: ExplorationCoverageSummaryProps) {
  const phaseLabel = getMessage(coverage.phase.labelKey as MessageKey);
  return (
    <Card size="3" data-testid="exploration-coverage-summary">
      <Flex align="center" gap="5" wrap="wrap">
        <Flex direction="column" gap="1" style={{ minWidth: 180 }}>
          <Text as="span" className={styles.eyebrow}>
            {getMessage('explorationCoverageGlobal')}
          </Text>
          <Text as="span" size="9" weight="bold" className={styles.coveragePercent}>
            {coverage.percent}
            <Text as="span" size="6" weight="medium"> %</Text>
          </Text>
          <Text as="span" size="2" color="gray">
            {getMessage('explorationCoverageRatio', [String(coverage.discovered), String(coverage.total)])}
          </Text>
        </Flex>

        <Box className={styles.coverageDivider} aria-hidden="true" />

        <Flex direction="column" gap="2" style={{ flex: 1, minWidth: 240 }}>
          <Text as="div" size="2" color="gray">
            {getMessage('explorationCurrentPhase')}{' '}
            <Text as="span" weight="bold" color="gray" highContrast>
              {phaseLabel}
            </Text>
          </Text>
          <PhaseBar ratio={coverage.ratio} currentIndex={coverage.phase.index} />
        </Flex>
      </Flex>
    </Card>
  );
}
