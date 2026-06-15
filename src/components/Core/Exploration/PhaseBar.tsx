import { Box, Flex, Progress, Text } from '@radix-ui/themes';
import { EXPLORATION_PHASES } from '@/exploration/phases.js';
import { getMessage, type MessageKey } from '@/utils/i18n.js';
import styles from './Exploration.module.css';

interface PhaseBarProps {
  /** Coverage ratio in [0, 1]. */
  ratio: number;
  /** Index of the current phase (0-based). */
  currentIndex: number;
}

/** Flex alignment for a band: edges hug the track, the rest stays centered. */
function bandAlign(index: number, lastIndex: number): 'start' | 'center' | 'end' {
  if (index === 0) return 'start';
  if (index === lastIndex) return 'end';
  return 'center';
}

/** Text alignment mirroring {@link bandAlign} for the band labels. */
function bandTextAlign(index: number, lastIndex: number): 'left' | 'center' | 'right' {
  if (index === 0) return 'left';
  if (index === lastIndex) return 'right';
  return 'center';
}

/** State i18n key for a band, never conveyed by color alone. */
function phaseStateKey(isDone: boolean, isCurrent: boolean): MessageKey {
  if (isDone) return 'explorationPhaseStateDone';
  if (isCurrent) return 'explorationPhaseStateCurrent';
  return 'explorationPhaseStateUpcoming';
}

/**
 * Phase journey for direction `bar`. A single global progress bar marks the real
 * phase boundaries as ticks (the thresholds are intentionally uneven: 25 / 60 /
 * 85 %) plus a marker at the current coverage. Underneath, the four phases are
 * laid out as bands proportional to their coverage range. Each phase carries its
 * state in text (done / in progress / upcoming), never by color alone, and the
 * full range is exposed to assistive tech via the band's accessible name.
 */
export function PhaseBar({ ratio, currentIndex }: PhaseBarProps) {
  const percent = Math.round(Math.min(Math.max(ratio, 0), 1) * 100);
  const lastIndex = EXPLORATION_PHASES.length - 1;

  return (
    <Box>
      <Box className={styles.phaseTrack}>
        <Progress value={percent} size="2" aria-hidden="true" />
        {EXPLORATION_PHASES.slice(1).map((phase) => (
          <span
            key={phase.key}
            className={styles.phaseTick}
            style={{ left: `${Math.round(phase.min * 100)}%` }}
            aria-hidden="true"
          />
        ))}
        <span className={styles.phaseHead} style={{ left: `${percent}%` }} aria-hidden="true" />
      </Box>

      <Flex mt="2">
        {EXPLORATION_PHASES.map((phase, index) => {
          const isCurrent = index === currentIndex;
          const isDone = index < currentIndex;
          const minPct = Math.round(phase.min * 100);
          const maxPct = Math.min(Math.round(phase.max * 100), 100);
          const align = bandAlign(index, lastIndex);
          const textAlign = bandTextAlign(index, lastIndex);
          const stateKey = phaseStateKey(isDone, isCurrent);
          const name = getMessage(phase.labelKey as MessageKey);
          const range = getMessage('explorationPhaseRangeLabel', [String(minPct), String(maxPct)]);
          const state = getMessage(stateKey);
          return (
            <Flex
              key={phase.key}
              direction="column"
              align={align}
              role="group"
              aria-label={`${name}, ${range}, ${state}`}
              className={styles.phaseBand}
              style={{ flexGrow: maxPct - minPct, flexBasis: 0 }}
            >
              <Text
                size="1"
                weight="medium"
                align={textAlign}
                color={isDone || isCurrent ? 'indigo' : 'gray'}
                className={styles.phaseState}
                aria-hidden="true"
              >
                {state}
              </Text>
              <Text
                size="1"
                weight={isCurrent ? 'bold' : 'regular'}
                align={textAlign}
                color={isCurrent || isDone ? undefined : 'gray'}
                className={styles.phaseLabel}
                data-current={isCurrent || undefined}
                aria-hidden="true"
              >
                {name}
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
}
