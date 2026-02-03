import { Box, Flex, Heading, IconButton, Separator } from '@radix-ui/themes';
import { Settings } from 'lucide-react';

interface PopupHeaderProps {
  title: string;
  onSettingsOpen: () => void;
}

export function PopupHeader({ title, onSettingsOpen }: PopupHeaderProps) {
  return (
    <Box>
      <Box
        px="3"
        py="3"
        style={{
          background: 'linear-gradient(135deg, var(--accent-a8) 0%, var(--accent-a10) 100%)',
          borderRadius: 'var(--radius-3)',
          marginBottom: 'var(--space-2)',
        }}
      >
        <Flex justify="between" align="center" width="100%">
          <Flex align="center" gap="3">
            <Box
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-2)',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
            >
              <img
                src="/icons/icon48.png"
                alt="Logo"
                style={{
                  width: 24,
                  height: 24,
                  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
                }}
              />
            </Box>
            <Heading
              size="5"
              weight="bold"
              style={{
                color: 'white',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
              }}
            >
              {title}
            </Heading>
          </Flex>
          <IconButton
            variant="ghost"
            size="2"
            onClick={onSettingsOpen}
            aria-label="Open settings"
            style={{
              color: 'white',
              background: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <Settings size={20} />
          </IconButton>
        </Flex>
      </Box>
      <Separator size="4" style={{ opacity: 0.3 }} />
    </Box>
  );
}