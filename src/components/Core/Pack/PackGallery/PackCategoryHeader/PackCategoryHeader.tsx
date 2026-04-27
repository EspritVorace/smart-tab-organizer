import { Flex, Text } from '@radix-ui/themes';

interface PackCategoryHeaderProps {
  label: string;
  icon?: string;
  count: number;
}

export function PackCategoryHeader({ label, icon, count }: PackCategoryHeaderProps) {
  return (
    <Flex
      align="center"
      gap="2"
      mt="4"
      mb="2"
      style={{ paddingInlineStart: 'var(--space-1)' }}
    >
      {icon && (
        <Text size="3" aria-hidden="true">
          {icon}
        </Text>
      )}
      <Text size="2" weight="medium" color="gray">
        {label}
      </Text>
      <Text size="1" color="gray">
        ({count})
      </Text>
    </Flex>
  );
}
