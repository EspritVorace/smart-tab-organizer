import { Box, Card, Flex, Heading, Separator, Text } from '@radix-ui/themes';
import { HardDrive } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { formatBytes } from '@/utils/formatBytes';
import { BarRow } from '@/components/Core/Statistics/primitives';
import type { StorageUsageSnapshot } from '@/hooks/useStorageUsage';

interface StatisticsStorageDetailProps {
  usage: StorageUsageSnapshot;
}

/**
 * Storage sub-page: global quota usage plus a per-category breakdown of the
 * local storage footprint.
 */
export function StatisticsStorageDetail({ usage }: StatisticsStorageDetailProps) {
  const maxBytes = usage.categories.length > 0 ? usage.categories[0].bytes : 0;
  const quotaPct = usage.quotaBytes > 0 ? Math.min(100, Math.round(usage.quotaPercent)) : 0;

  return (
    <Box data-testid="page-stats-storage">
      <Card data-testid="page-stats-card-storage">
        <Flex direction="column" gap="4" p="2">
          <Flex align="center" gap="2">
            <HardDrive size={16} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />
            <Heading size="3">{getMessage('statsStorageTitle')}</Heading>
          </Flex>

          <Box>
            <Text size="2" color="gray">
              {getMessage('statsStorageQuota')
                .replace('{used}', formatBytes(usage.globalTotalBytes))
                .replace('{quota}', formatBytes(usage.quotaBytes))
                .replace('{percent}', String(quotaPct))}
            </Text>
            <Box mt="2" style={{
              height: '14px',
              borderRadius: 'var(--radius-2)',
              backgroundColor: 'var(--gray-a3)',
              overflow: 'hidden',
            }}>
              <Box style={{
                height: '100%',
                width: `${quotaPct}%`,
                backgroundColor: 'var(--accent-9)',
                borderRadius: 'var(--radius-2)',
              }} />
            </Box>
          </Box>

          <Separator size="4" />

          {usage.categories.length > 0 ? (
            <Flex direction="column" gap="3">
              {usage.categories.map((cat, index) => (
                <BarRow
                  key={cat.id}
                  index={index}
                  label={getMessage(cat.labelKey)}
                  value={cat.bytes}
                  valueLabel={formatBytes(cat.bytes)}
                  maxValue={maxBytes}
                  testId={`page-stats-storage-row-${cat.id}`}
                />
              ))}
            </Flex>
          ) : (
            <Text size="2" color="gray">—</Text>
          )}
        </Flex>
      </Card>
    </Box>
  );
}
