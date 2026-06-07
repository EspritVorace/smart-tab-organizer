import { Box, Card, Flex, Heading, Separator, Text, Theme } from '@radix-ui/themes';
import { HardDrive } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { formatBytes } from '@/utils/formatBytes';
import { BarRow } from '@/components/Core/Statistics/primitives';
import { WorkspaceAvatar } from '@/components/UI/Workspace/WorkspaceAvatar';
import type { StorageUsageSnapshot, WorkspaceUsageBreakdown } from '@/hooks/useStorageUsage';

interface StatisticsStorageDetailProps {
  usage: StorageUsageSnapshot;
}

/** Flat per-category breakdown (single-workspace view). */
function CategoryBreakdown({ categories }: { categories: StorageUsageSnapshot['categories'] }) {
  const maxBytes = categories.length > 0 ? categories[0].bytes : 0;

  if (categories.length === 0) {
    return <Text size="2" color="gray">—</Text>;
  }

  return (
    <Flex direction="column" gap="3">
      {categories.map((cat, index) => (
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
  );
}

/**
 * One workspace section: identity header (avatar + name + total) plus its
 * non-empty categories. Wrapped in a nested `Theme` so the bars (and avatar)
 * adopt the workspace accent color via the re-scoped `--accent-*` tokens.
 */
function WorkspaceSection({
  workspace,
  maxBytes,
}: {
  workspace: WorkspaceUsageBreakdown;
  maxBytes: number;
}) {
  const visibleCategories = workspace.categories.filter((cat) => cat.bytes > 0);

  return (
    <Theme accentColor={workspace.accentColor}>
      <Flex
        direction="column"
        gap="3"
        data-testid={`page-stats-storage-ws-${workspace.workspaceId}`}
      >
        <Flex align="center" gap="2" justify="between">
          <Flex align="center" gap="2" style={{ minWidth: 0 }}>
            <WorkspaceAvatar name={workspace.name} accentColor={workspace.accentColor} size="sm" />
            <Text
              size="2"
              weight="medium"
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {workspace.name}
            </Text>
          </Flex>
          <Text size="2" weight="bold" style={{ flexShrink: 0 }}>
            {formatBytes(workspace.totalBytes)}
          </Text>
        </Flex>

        {visibleCategories.length > 0 ? (
          <Flex direction="column" gap="3">
            {visibleCategories.map((cat, index) => (
              <BarRow
                key={cat.id}
                index={index}
                label={getMessage(cat.labelKey)}
                value={cat.bytes}
                valueLabel={formatBytes(cat.bytes)}
                maxValue={maxBytes}
                testId={`page-stats-storage-row-${workspace.workspaceId}-${cat.id}`}
              />
            ))}
          </Flex>
        ) : (
          <Text size="2" color="gray">—</Text>
        )}
      </Flex>
    </Theme>
  );
}

/**
 * Storage sub-page: global quota usage plus a breakdown of the local storage
 * footprint. With several workspaces, the breakdown is split into one section
 * per workspace; otherwise it stays a flat per-category list.
 */
export function StatisticsStorageDetail({ usage }: StatisticsStorageDetailProps) {
  const quotaPct = usage.quotaBytes > 0 ? Math.min(100, Math.round(usage.quotaPercent)) : 0;
  const isSplit = usage.workspaces.length > 1;
  // Comparable bar scale across every workspace section.
  const splitMaxBytes = isSplit
    ? Math.max(0, ...usage.workspaces.flatMap((ws) => ws.categories.map((c) => c.bytes)))
    : 0;

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

          {isSplit ? (
            <Flex direction="column" gap="4">
              <Text size="2" color="gray" weight="medium">
                {getMessage('statsStorageByWorkspace')}
              </Text>
              {usage.workspaces.map((ws) => (
                <WorkspaceSection key={ws.workspaceId} workspace={ws} maxBytes={splitMaxBytes} />
              ))}
            </Flex>
          ) : (
            <CategoryBreakdown categories={usage.categories} />
          )}
        </Flex>
      </Card>
    </Box>
  );
}
