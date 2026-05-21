import { Heading, Box, Text } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import type { AppSettings } from '@/types/syncSettings.js';
import { StatusBar } from '@/components/UI/StatusBar/StatusBar';

interface PageLayoutProps {
  titleKey: string;
  descriptionKey: string;
  syncSettings: AppSettings;
  children: (settings: AppSettings) => React.ReactNode;
}

export function PageLayout({ titleKey, descriptionKey, syncSettings, children }: PageLayoutProps) {
  return (
    <Box style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box
        data-testid="page-layout-header"
        pb="3"
        style={{ borderBottom: '1px solid var(--gray-a4)' }}
      >
        <Heading size="5" weight="bold" as="h1" style={{ letterSpacing: '-0.02em' }}>
          {getMessage(titleKey)}
        </Heading>

        <Box data-testid="page-layout-description" pt="2">
          <Text size="2" color="gray" as="p" style={{ margin: 0 }}>
            {getMessage(descriptionKey)}
          </Text>
        </Box>
      </Box>

      <Box
        data-testid="page-layout-content"
        pt="4"
        style={{ flex: 1, overflow: 'auto', minHeight: 0 }}
      >
        {children(syncSettings)}
      </Box>

      <StatusBar />
    </Box>
  );
}
