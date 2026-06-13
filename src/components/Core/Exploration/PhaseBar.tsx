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

/**
 * The retained phase visualization (direction `bar`): a single global progress
 * bar with the four phase names laid out underneath, the current one in bold.
 * The phase state is carried by text, never by color alone.
 */
export function PhaseBar({ ratio, currentIndex }: PhaseBarProps) {
  const percent = Math.round(Math.min(Math.max(ratio, 0), 1) * 100);
  return (
    <Box>
      <Progress value={percent} size="2" aria-hidden="true" />
      <Flex justify="between" mt="2" gap="1">
        {EXPLORATION_PHASES.map((phase, index) => {
          const isCurrent = index === currentIndex;
          const isDone = index < currentIndex;
          let align: 'left' | 'center' | 'right' = 'center';
          if (index === 0) align = 'left';
          else if (index === EXPLORATION_PHASES.length - 1) align = 'right';
          return (
            <Text
              key={phase.key}
              size="1"
              weight={isCurrent ? 'bold' : 'regular'}
              align={align}
              color={isCurrent || isDone ? undefined : 'gray'}
              className={styles.phaseLabel}
              data-current={isCurrent || undefined}
            >
              {getMessage(phase.labelKey as MessageKey)}
            </Text>
          );
        })}
      </Flex>
    </Box>
  );
}
