import { Box, Card, Flex, Text, Tooltip } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import { TrendBadge } from '@/components/Core/Statistics/TrendBadge';
import type { GroupColorStat } from '@/hooks/useSessionStatistics';
import type { ChromeGroupColor } from '@/types/tabTree';

interface MetricRowProps {
  label: string;
  value: React.ReactNode;
  current: number;
  previous: number;
  /** Text size for the value. Defaults to "4". */
  valueSize?: '3' | '4';
  /** Color applied to the label text. Defaults to no color (weight="medium"). */
  labelColor?: 'gray';
}

/**
 * A single metric row: label on the left, bold value + TrendBadge on the right.
 * Used in ThisWeekStatsCard and SessionActivityCard.
 */
export function MetricRow({ label, value, current, previous, valueSize = '4', labelColor }: MetricRowProps) {
  return (
    <Flex justify="between" align="center">
      {labelColor ? (
        <Text size="2" color={labelColor}>{label}</Text>
      ) : (
        <Text size="2" weight="medium">{label}</Text>
      )}
      <Flex align="center" gap="3">
        <Text size={valueSize} weight="bold">{value}</Text>
        <TrendBadge current={current} previous={previous} />
      </Flex>
    </Flex>
  );
}

export const GROUP_COLOR_CSS: Record<ChromeGroupColor, string> = {
  grey: 'var(--gray-9)',
  blue: 'var(--blue-9)',
  red: 'var(--red-9)',
  yellow: 'var(--yellow-9)',
  green: 'var(--green-9)',
  pink: 'var(--pink-9)',
  purple: 'var(--purple-9)',
  cyan: 'var(--cyan-9)',
  orange: 'var(--orange-9)',
};

export const GROUP_COLOR_LABEL_KEY: Record<ChromeGroupColor, string> = {
  grey: 'statsGroupColorGrey',
  blue: 'statsGroupColorBlue',
  red: 'statsGroupColorRed',
  yellow: 'statsGroupColorYellow',
  green: 'statsGroupColorGreen',
  pink: 'statsGroupColorPink',
  purple: 'statsGroupColorPurple',
  cyan: 'statsGroupColorCyan',
  orange: 'statsGroupColorOrange',
};

export function KpiTile({ icon, label, value, testId }: { icon: React.ReactNode; label: string; value: React.ReactNode; testId?: string }) {
  return (
    <Card data-testid={testId} style={{ flex: '1', minWidth: '150px' }}>
      <Flex direction="column" gap="2" p="3">
        <Flex align="center" gap="2">
          {icon}
          <Text size="2" color="gray" highContrast>{label}</Text>
        </Flex>
        <Text size="8" weight="bold" style={{ color: 'var(--accent-11)' }}>
          {value}
        </Text>
      </Flex>
    </Card>
  );
}

export function SmallKpiTile({ icon, label, value, testId, minWidth = '110px' }: { icon: React.ReactNode; label: string; value: React.ReactNode; testId?: string; minWidth?: string | number }) {
  return (
    <Card data-testid={testId} style={{ flex: '1', minWidth }}>
      <Flex direction="column" gap="1" p="2">
        <Flex align="center" gap="1">
          {icon}
          <Text size="1" color="gray" highContrast>{label}</Text>
        </Flex>
        <Text size="6" weight="bold" style={{ color: 'var(--accent-11)' }}>
          {value}
        </Text>
      </Flex>
    </Card>
  );
}

interface BarRowProps {
  label: string;
  value: number;
  maxValue: number;
  index: number;
  testId?: string;
  rightDetail?: string;
  /** Overrides the displayed value (e.g. a formatted size). The bar width still uses `value`. */
  valueLabel?: string;
}

export function BarRow({ label, value, maxValue, index, testId, rightDetail, valueLabel }: BarRowProps) {
  const widthPct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
  return (
    <Box data-testid={testId}>
      <Flex justify="between" align="baseline" mb="1">
        <Text size="2" weight="medium" style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {index + 1}. {label}
        </Text>
        <Flex direction="column" align="end" gap="1">
          <Text size="2" weight="bold">{valueLabel ?? value}</Text>
          {rightDetail && <Text size="1" color="gray">{rightDetail}</Text>}
        </Flex>
      </Flex>
      <Box style={{
        height: '6px',
        borderRadius: 'var(--radius-1)',
        backgroundColor: 'var(--gray-a3)',
        overflow: 'hidden',
      }}>
        <Box style={{
          height: '100%',
          width: `${widthPct}%`,
          backgroundColor: 'var(--accent-9)',
          borderRadius: 'var(--radius-1)',
        }} />
      </Box>
    </Box>
  );
}

export function GroupColorBar({ distribution }: { distribution: GroupColorStat[] }) {
  const total = distribution.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return null;

  return (
    <Box>
      <Box
        style={{
          display: 'flex',
          width: '100%',
          height: '14px',
          borderRadius: 'var(--radius-2)',
          overflow: 'hidden',
          backgroundColor: 'var(--gray-a3)',
        }}
        data-testid="page-stats-color-distribution"
      >
        {distribution.map(d => (
          <Tooltip key={d.color} content={`${getMessage(GROUP_COLOR_LABEL_KEY[d.color])} (${d.count})`}>
            <Box
              style={{
                width: `${(d.count / total) * 100}%`,
                backgroundColor: GROUP_COLOR_CSS[d.color],
              }}
            />
          </Tooltip>
        ))}
      </Box>
      <Flex gap="3" wrap="wrap" mt="2">
        {distribution.map(d => (
          <Flex key={d.color} align="center" gap="1">
            <Box style={{
              width: '10px',
              height: '10px',
              borderRadius: 'var(--radius-1)',
              backgroundColor: GROUP_COLOR_CSS[d.color],
            }} />
            <Text size="1" color="gray">{getMessage(GROUP_COLOR_LABEL_KEY[d.color])} ({d.count})</Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}
