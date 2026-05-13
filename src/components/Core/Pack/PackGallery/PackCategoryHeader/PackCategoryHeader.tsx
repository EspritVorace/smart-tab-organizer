import { Badge, Box, Flex, Separator, Text } from '@radix-ui/themes';

interface PackCategoryHeaderProps {
  label: string;
  icon?: string;
  count: number;
}

export function PackCategoryHeader({ label, icon, count }: PackCategoryHeaderProps) {
  return (
    <Flex
      align="center"
      gap="3"
      mt="5"
      mb="3"
      style={{ paddingInlineStart: 'var(--space-1)' }}
    >
      {icon && (
        <Text size="4" aria-hidden="true" style={{ lineHeight: 1 }}>
          {icon}
        </Text>
      )}
      <Text size="3" weight="medium" style={{ color: 'var(--gray-12)' }}>
        {label}
      </Text>
      <Badge color="gray" variant="soft" size="1" radius="full">
        {count}
      </Badge>
      <Box flexGrow="1">
        <Separator size="4" />
      </Box>
    </Flex>
  );
}
