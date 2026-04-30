import { Flex, Text, Box, Badge, Checkbox } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import type { Session } from '@/types/session';
import type { ConflictingSession, SessionDiff, GroupDiff } from '@/utils/sessionClassification';
import { DiffPopover, DiffPropertyValues } from './Shared';
import { SessionCard } from '@/components/Core/Session/SessionCard';

/* ─── SessionRow ─────────────────────────────────────────────────────────── */

export interface SessionRowProps {
  session: Session;
  checkbox?: boolean;
  checked?: boolean;
  onToggle?: () => void;
  dimmed?: boolean;
  statusBadge?: string;
}

export function SessionRow({ session, checkbox, checked, onToggle, dimmed, statusBadge }: SessionRowProps) {
  const trailingBadges = (session.isPinned || statusBadge) ? (
    <Flex gap="1">
      {session.isPinned && (
        <Badge color="indigo" variant="soft" size="1">{getMessage('pinnedBadge')}</Badge>
      )}
      {statusBadge && (
        <Badge color="gray" variant="outline" size="1">{statusBadge}</Badge>
      )}
    </Flex>
  ) : undefined;

  return (
    <SessionCard
      session={session}
      variant="summary"
      status={dimmed ? 'identical' : 'default'}
      leading={checkbox ? (
        <Checkbox checked={checked} onCheckedChange={onToggle} aria-label={session.name} />
      ) : undefined}
      trailing={trailingBadges}
    />
  );
}

/* ─── ConflictSessionRow ─────────────────────────────────────────────────── */

export interface ConflictSessionRowProps {
  conflict: ConflictingSession;
}

export function ConflictSessionRow({ conflict }: ConflictSessionRowProps) {
  const session = conflict.imported;
  return (
    <SessionCard
      session={session}
      variant="summary"
      status="conflict"
      trailing={
        <Flex gap="1" align="center">
          {session.isPinned && (
            <Badge color="indigo" variant="soft" size="1">{getMessage('pinnedBadge')}</Badge>
          )}
          <DiffPopover entityLabel={session.name} maxWidth={380}>
            <SessionDiffView diff={conflict.diff} />
          </DiffPopover>
        </Flex>
      }
    />
  );
}

/* ─── SessionDiffView ────────────────────────────────────────────────────── */

interface SessionDiffViewProps {
  diff: SessionDiff;
}

export function SessionDiffView({ diff }: SessionDiffViewProps) {
  const hasContent =
    diff.isPinned !== undefined ||
    diff.categoryId !== undefined ||
    diff.groupsAdded.length > 0 ||
    diff.groupsRemoved.length > 0 ||
    diff.groupsChanged.length > 0 ||
    diff.ungroupedTabsAdded.length > 0 ||
    diff.ungroupedTabsRemoved.length > 0;

  if (!hasContent) return null;

  return (
    <Flex direction="column" gap="3">
      {diff.isPinned !== undefined && (
        <DiffPropertyValues
          label="isPinned"
          current={String(diff.isPinned.current)}
          imported={String(diff.isPinned.imported)}
        />
      )}

      {diff.categoryId !== undefined && (
        <DiffPropertyValues
          label="categoryId"
          current={String(diff.categoryId.current ?? 'null')}
          imported={String(diff.categoryId.imported ?? 'null')}
        />
      )}

      {diff.groupsAdded.length > 0 && (
        <Box>
          <Text size="2" weight="medium" mb="1">Groups added</Text>
          {diff.groupsAdded.map(title => (
            <Text key={title} size="1" color="green" as="p">{title}</Text>
          ))}
        </Box>
      )}

      {diff.groupsRemoved.length > 0 && (
        <Box>
          <Text size="2" weight="medium" mb="1">Groups removed</Text>
          {diff.groupsRemoved.map(title => (
            <Text key={title} size="1" color="red" as="p">{title}</Text>
          ))}
        </Box>
      )}

      {diff.groupsChanged.map(groupDiff => (
        <GroupDiffView key={groupDiff.title} groupDiff={groupDiff} />
      ))}

      {(diff.ungroupedTabsAdded.length > 0 || diff.ungroupedTabsRemoved.length > 0) && (
        <Box>
          <Text size="2" weight="medium" mb="1">Ungrouped tabs</Text>
          {diff.ungroupedTabsAdded.map(url => (
            <Text key={url} size="1" color="green" as="p" style={{ wordBreak: 'break-all' }}>+ {url}</Text>
          ))}
          {diff.ungroupedTabsRemoved.map(url => (
            <Text key={url} size="1" color="red" as="p" style={{ wordBreak: 'break-all' }}>- {url}</Text>
          ))}
        </Box>
      )}
    </Flex>
  );
}

/* ─── GroupDiffView ──────────────────────────────────────────────────────── */

interface GroupDiffViewProps {
  groupDiff: GroupDiff;
}

function GroupDiffView({ groupDiff }: GroupDiffViewProps) {
  return (
    <Box>
      <Text size="2" weight="medium" mb="1">Group: {groupDiff.title}</Text>
      {groupDiff.colorChanged && (
        <Box mb="1">
          <DiffPropertyValues
            current={groupDiff.colorChanged.current}
            imported={groupDiff.colorChanged.imported}
          />
        </Box>
      )}
      {groupDiff.tabsAdded.map(url => (
        <Text key={url} size="1" color="green" as="p" style={{ wordBreak: 'break-all' }}>+ {url}</Text>
      ))}
      {groupDiff.tabsRemoved.map(url => (
        <Text key={url} size="1" color="red" as="p" style={{ wordBreak: 'break-all' }}>- {url}</Text>
      ))}
    </Box>
  );
}
