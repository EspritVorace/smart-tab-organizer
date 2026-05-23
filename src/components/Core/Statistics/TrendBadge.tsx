import { Flex, Text } from '@radix-ui/themes';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getMessage } from '@/utils/i18n';

type TrendDirection = 'new' | 'up' | 'down' | 'stable';

function getTrend(current: number, previous: number): TrendDirection {
  if (current === 0 && previous === 0) return 'stable';
  if (previous === 0 && current > 0) return 'new';
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'stable';
}

export interface TrendBadgeProps {
  current: number;
  previous: number;
}

export function TrendBadge({ current, previous }: TrendBadgeProps) {
  const trend = getTrend(current, previous);
  const diff = Math.abs(current - previous);

  if (trend === 'stable') {
    return (
      <Flex align="center" gap="1">
        <Minus size={14} style={{ color: 'var(--gray-9)' }} />
        <Text size="1" color="gray">{getMessage('statsTrendStable')}</Text>
      </Flex>
    );
  }

  if (trend === 'new') {
    return (
      <Flex align="center" gap="1">
        <TrendingUp size={14} style={{ color: 'var(--accent-9)' }} />
        <Text size="1" style={{ color: 'var(--accent-11)' }}>{getMessage('statsTrendNewActivity')}</Text>
      </Flex>
    );
  }

  if (trend === 'up') {
    return (
      <Flex align="center" gap="1">
        <TrendingUp size={14} aria-label={getMessage('statsTrendUpAria')} style={{ color: 'var(--green-9)' }} />
        <Text size="1" style={{ color: 'var(--green-11)' }}>
          {getMessage('statsTrendUp').replace('{count}', String(diff))}
        </Text>
      </Flex>
    );
  }

  return (
    <Flex align="center" gap="1">
      <TrendingDown size={14} aria-label={getMessage('statsTrendDownAria')} style={{ color: 'var(--orange-9)' }} />
      <Text size="1" style={{ color: 'var(--orange-11)' }}>
        {getMessage('statsTrendDown').replace('{count}', String(diff))}
      </Text>
    </Flex>
  );
}
