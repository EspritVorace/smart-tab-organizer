import { Flex, Text } from '@radix-ui/themes';

/** Expanded sidebar header: logo + app name. */
export function OptionsHeader() {
  return (
    <Flex data-testid="options-header" align="center" gap="3" style={{ width: '100%', minWidth: 0 }}>
      <img
        src="/icons/48.png"
        alt=""
        aria-hidden="true"
        style={{ width: '32px', height: '32px', flexShrink: 0 }}
      />
      <Flex direction="column" gap="0" style={{ lineHeight: '1.2', flex: 1, minWidth: 0 }}>
        <Text size="3" weight="bold" style={{ color: 'var(--gray-12)' }}>SmartTab</Text>
        <Text size="3" weight="bold" style={{ color: 'var(--gray-12)' }}>Organizer</Text>
      </Flex>
    </Flex>
  );
}

/** Collapsed sidebar header: logo only. */
export function OptionsHeaderCollapsed() {
  return (
    <Flex align="center" justify="center" style={{ width: '100%' }}>
      <img
        src="/icons/48.png"
        alt=""
        aria-hidden="true"
        style={{ width: '32px', height: '32px' }}
      />
    </Flex>
  );
}
