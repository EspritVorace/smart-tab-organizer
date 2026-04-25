import { Box, Flex, Heading, IconButton } from '@radix-ui/themes';
import { Settings } from 'lucide-react';
import { getMessage } from '@/utils/i18n';

interface PopupHeaderProps {
  title: string;
  onSettingsOpen: () => void;
}

export function PopupHeader({ title, onSettingsOpen }: PopupHeaderProps) {
  return (
    <Flex
      data-testid="popup-header"
      role="banner"
      justify="between"
      align="center"
      px="1"
      py="1"
      width="100%"
    >
      <Flex align="center" gap="2">
        <Box
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-2)',
            backgroundColor: 'var(--accent-a3)',
            color: 'var(--accent-11)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img src="/icons/icon48.png" alt="" aria-hidden="true" style={{ width: 20, height: 20 }} />
        </Box>
        <Heading size="3" weight="bold">
          {title}
        </Heading>
      </Flex>
      <IconButton
        data-testid="popup-header-btn-settings"
        variant="ghost"
        color="gray"
        size="2"
        onClick={onSettingsOpen}
        title={getMessage('openOptions')}
        aria-label={getMessage('openOptions')}
      >
        <Settings size={18} aria-hidden="true" />
      </IconButton>
    </Flex>
  );
}
