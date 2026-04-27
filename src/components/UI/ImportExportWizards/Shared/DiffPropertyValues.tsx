import React from 'react';
import { Badge, Box, Flex, Text } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';

interface DiffPropertyValuesProps {
  /** Optional bold label above the value pair. */
  label?: React.ReactNode;
  current: React.ReactNode;
  imported: React.ReactNode;
}

/**
 * "Current value / Imported value" badge pair used inside every conflict
 * diff viewer (rules, sessions, groups).
 */
export function DiffPropertyValues({ label, current, imported }: DiffPropertyValuesProps) {
  return (
    <Box>
      {label !== undefined && (
        <Text size="2" weight="medium" mb="1">{label}</Text>
      )}
      <Flex direction="column" gap="1">
        <Flex align="center" gap="2">
          <Badge color="red" variant="soft" size="1">{getMessage('currentValue')}</Badge>
          <Text size="1">{current}</Text>
        </Flex>
        <Flex align="center" gap="2">
          <Badge color="green" variant="soft" size="1">{getMessage('importedValue')}</Badge>
          <Text size="1">{imported}</Text>
        </Flex>
      </Flex>
    </Box>
  );
}
