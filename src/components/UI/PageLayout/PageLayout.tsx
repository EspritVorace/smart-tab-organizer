import { Heading, Box, Flex, Separator, Text } from '@radix-ui/themes';
import type { LucideIcon } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import type { AppSettings } from '@/types/syncSettings.js';

interface PageLayoutProps {
  titleKey: string;
  descriptionKey: string;
  icon?: LucideIcon;
  syncSettings: AppSettings;
  children: (settings: AppSettings) => React.ReactNode;
}

export function PageLayout({ titleKey, descriptionKey, icon: Icon, syncSettings, children }: PageLayoutProps) {
  return (
    <Box style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box data-testid="page-layout-header">
        <Box
          px="4"
          py="3"
          style={{
            background: 'linear-gradient(135deg, var(--accent-a4) 0%, var(--accent-a6) 100%)',
            borderRadius: 'var(--radius-3)',
            marginBottom: 'var(--space-3)',
          }}
        >
          <Flex align="center" gap="3">
            {Icon && (
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-2)',
                  background: 'var(--accent-a3)',
                  border: '1px solid var(--accent-a6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={20} aria-hidden="true" style={{ color: 'var(--accent-11)' }} />
              </Box>
            )}
            <Heading size="5" weight="bold" as="h1">
              {getMessage(titleKey)}
            </Heading>
          </Flex>
        </Box>
        <Separator size="4" style={{ opacity: 0.3 }} />
      </Box>

      <Box
        data-testid="page-layout-description"
        px="4"
        pt="3"
      >
        <Text size="2" color="gray" as="p" style={{ margin: 0 }}>
          {getMessage(descriptionKey)}
        </Text>
      </Box>

      <Box data-testid="page-layout-content" style={{ flex: 1, overflow: 'auto', marginTop: 'var(--space-3)', backgroundColor: 'var(--accent-a2)', borderRadius: 'var(--radius-3)', padding: 'var(--space-4)' }}>
        {children(syncSettings)}
      </Box>
    </Box>
  );
}
