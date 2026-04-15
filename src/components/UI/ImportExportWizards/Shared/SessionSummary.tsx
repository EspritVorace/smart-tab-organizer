import React from 'react';
import { Flex, Text } from '@radix-ui/themes';
import {
  countSessionTabs,
  formatSessionDateShort,
  getSessionGroupLabel,
  getSessionTabLabel,
} from '../../../../utils/sessionUtils';
import type { Session } from '../../../../types/session';

interface SessionSummaryProps {
  session: Session;
}

/**
 * Two-line block with the session name plus "date · N groups · M tabs"
 * metadata. Shared by every row that renders a session inside import or
 * export wizards.
 */
export function SessionSummary({ session }: SessionSummaryProps) {
  const tabCount = countSessionTabs(session);
  const groupCount = session.groups.length;
  return (
    <Flex direction="column" gap="1" style={{ flex: 1 }}>
      <Text size="2" weight="medium">{session.name}</Text>
      <Text size="1" color="gray">
        {formatSessionDateShort(session.createdAt)} · {getSessionGroupLabel(groupCount)} · {getSessionTabLabel(tabCount)}
      </Text>
    </Flex>
  );
}
