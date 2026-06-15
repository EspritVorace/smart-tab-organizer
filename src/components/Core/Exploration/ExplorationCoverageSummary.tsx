import { useEffect, useState } from 'react';
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
/**
 * Counts an integer up from 0 to `target` once on mount. Honors
 * `prefers-reduced-motion` by jumping straight to the final value. The animated
 * number lives outside any aria-live region, so screen readers read the final
 * value (and the textual ratio below carries the exact counts regardless).
 */
function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

export function ExplorationCoverageSummary({ coverage }: ExplorationCoverageSummaryProps) {
  const phaseLabel = getMessage(coverage.phase.labelKey as MessageKey);
  const displayPercent = useCountUp(coverage.percent);
  return (
    <Card size="3" data-testid="exploration-coverage-summary">
      <Flex align="center" gap="5" wrap="wrap">
        <Flex direction="column" gap="1" style={{ minWidth: 180 }}>
          <Text as="span" className={styles.eyebrow}>
            {getMessage('explorationCoverageGlobal')}
          </Text>
          <Text as="span" size="9" weight="bold" className={styles.coveragePercent}>
            {displayPercent}
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
          <Text as="div" size="1" color="gray">
            {getMessage('explorationPhaseHint')}
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
}
