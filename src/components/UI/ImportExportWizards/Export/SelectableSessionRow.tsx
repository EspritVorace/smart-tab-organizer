import React from 'react';
import { Checkbox, Flex, Text } from '@radix-ui/themes';
import {
  countSessionTabs,
  formatSessionDateShort,
  getSessionGroupLabel,
  getSessionTabLabel,
} from '../../../../utils/sessionUtils';
import type { Session } from '../../../../types/session';

interface SelectableSessionRowProps {
  session: Session;
  checked: boolean;
  onToggle: () => void;
}

export function SelectableSessionRow({ session, checked, onToggle }: SelectableSessionRowProps) {
  const tabCount = countSessionTabs(session);
  const groupCount = session.groups.length;
  return (
    <Flex
      align="center"
      gap="3"
      p="2"
      style={{
        borderRadius: 'var(--radius-2)',
        backgroundColor: 'var(--gray-a2)',
      }}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        aria-label={session.name}
      />
      <Flex direction="column" gap="1" style={{ flex: 1 }}>
        <Text size="2" weight="medium">{session.name}</Text>
        <Text size="1" color="gray">
          {formatSessionDateShort(session.createdAt)} · {getSessionGroupLabel(groupCount)} · {getSessionTabLabel(tabCount)}
        </Text>
      </Flex>
    </Flex>
  );
}
