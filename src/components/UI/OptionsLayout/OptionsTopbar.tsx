import { Flex, IconButton, Text, Tooltip } from '@radix-ui/themes';
import { HelpCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/UI/ThemeToggle/ThemeToggle';
import { useShortcutsControl } from '@/contexts/ShortcutsControlContext';
import { getMessage } from '@/utils/i18n';

interface OptionsTopbarProps {
  pageTitle: string;
}

export function OptionsTopbar({ pageTitle }: OptionsTopbarProps) {
  const { openShortcuts } = useShortcutsControl();

  return (
    <Flex
      data-testid="options-topbar"
      align="center"
      justify="between"
      px="4"
      style={{
        height: '52px',
        flexShrink: 0,
        background: 'color-mix(in oklab, var(--color-background) 85%, transparent)',
        backdropFilter: 'saturate(180%) blur(12px)',
        WebkitBackdropFilter: 'saturate(180%) blur(12px)',
        borderBottom: '1px solid var(--gray-a4)',
        position: 'sticky',
        top: 0,
        zIndex: 5,
      }}
    >
      <Flex align="center" gap="2">
        <Text
          size="2"
          style={{
            color: 'var(--gray-10)',
            fontFamily: 'var(--code-font-family)',
            letterSpacing: '0.02em',
          }}
        >
          SmartTab Organizer
        </Text>
        <Text size="2" style={{ color: 'var(--gray-7)' }} aria-hidden="true">
          /
        </Text>
        <Text
          size="2"
          weight="medium"
          data-testid="topbar-page-title"
          style={{ color: 'var(--gray-12)', letterSpacing: '-0.005em' }}
        >
          {pageTitle}
        </Text>
      </Flex>
      <Flex align="center" gap="1">
        <ThemeToggle />
        <Tooltip content={getMessage('shortcutsPanelToggleAria')}>
          <IconButton
            data-testid="topbar-help"
            variant="ghost"
            size="2"
            onClick={openShortcuts}
            aria-label={getMessage('shortcutsPanelToggleAria')}
            style={{ color: 'var(--gray-11)' }}
          >
            <HelpCircle size={16} aria-hidden="true" />
          </IconButton>
        </Tooltip>
      </Flex>
    </Flex>
  );
}
