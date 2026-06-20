import type { ReactNode } from 'react';
import { Box, Card, Flex, Text } from '@radix-ui/themes';

interface SettingsSectionCardProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

/**
 * Wraps a settings section in the shared Card + heading row pattern:
 * a Card containing a padded Box, an icon + bold title row, then the
 * section content below.
 */
export function SettingsSectionCard({ icon, title, children }: SettingsSectionCardProps) {
  return (
    <Card>
      <Box p="4">
        <Flex align="center" gap="2" mb="4">
          {icon}
          <Text size="3" weight="bold">{title}</Text>
        </Flex>
        {children}
      </Box>
    </Card>
  );
}
