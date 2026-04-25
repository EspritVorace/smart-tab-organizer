import { Flex, Text } from '@radix-ui/themes';
import { ThemeToggle } from '@/components/UI/ThemeToggle/ThemeToggle';

interface OptionsHeaderProps {
  version: string;
}

/** Expanded sidebar header: logo, app name, version, theme toggle. */
export function OptionsHeader({ version }: OptionsHeaderProps) {
  return (
    <Flex data-testid="options-header" align="center" gap="3" style={{ width: '100%', paddingRight: '64px', position: 'relative' }}>
      <img
        src="/icons/icon48.png"
        alt=""
        aria-hidden="true"
        style={{ width: '32px', height: '32px', flexShrink: 0 }}
      />
      <Flex direction="column" gap="0" style={{ lineHeight: '1.2', flex: 1 }}>
        <Flex align="center" gap="2">
          <Text size="3" weight="bold" style={{ color: 'var(--gray-12)' }}>SmartTab</Text>
          <Text size="1" style={{ color: 'var(--gray-11)' }}>(v{version})</Text>
        </Flex>
        <Text size="3" weight="bold" style={{ color: 'var(--gray-12)' }}>Organizer</Text>
      </Flex>
      <Flex align="center" style={{ position: 'absolute', right: '8px' }}>
        <ThemeToggle />
      </Flex>
    </Flex>
  );
}

/** Collapsed sidebar header: logo only. */
export function OptionsHeaderCollapsed() {
  return (
    <Flex align="center" justify="center" style={{ width: '100%' }}>
      <img
        src="/icons/icon48.png"
        alt=""
        aria-hidden="true"
        style={{ width: '32px', height: '32px' }}
      />
    </Flex>
  );
}
