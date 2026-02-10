import { Theme, Heading, Box, Flex, Separator } from '@radix-ui/themes';
import type { LucideIcon } from 'lucide-react';
import { getMessage } from '../../../utils/i18n';
import { FEATURE_THEMES } from '../../../utils/themeConstants.js';
import type { SyncSettings } from '../../../types/syncSettings.js';
import type { FeatureTheme } from '../../../utils/themeConstants.js';

interface PageLayoutProps {
  titleKey: string;
  theme: FeatureTheme;
  icon?: LucideIcon;
  syncSettings: SyncSettings;
  children: (settings: SyncSettings) => React.ReactNode;
  headerActions?: React.ReactNode;
}

export function PageLayout({ titleKey, theme, icon: Icon, syncSettings, children, headerActions }: PageLayoutProps) {
  return (
    <Theme accentColor={FEATURE_THEMES[theme]}>
      <Box style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Box>
          <Box
            px="4"
            py="2"
            style={{
              background: 'linear-gradient(135deg, var(--accent-a8) 0%, var(--accent-a10) 100%)',
              borderRadius: 'var(--radius-3)',
              marginBottom: 'var(--space-3)',
            }}
          >
            <Flex justify="between" align="center" width="100%">
              <Flex align="center" gap="3">
                {Icon && (
                  <Box
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-2)',
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    <Icon
                      size={24}
                      style={{
                        color: 'white',
                        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
                      }}
                    />
                  </Box>
                )}
                <Heading
                  size="5"
                  weight="bold"
                  as="h1"
                  style={{
                    color: 'white',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {getMessage(titleKey)}
                </Heading>
              </Flex>
              {headerActions && <Box>{headerActions}</Box>}
            </Flex>
          </Box>
          <Separator size="4" style={{ opacity: 0.3 }} />
        </Box>

        <Box style={{ flex: 1, overflow: 'auto', marginTop: 'var(--space-3)', backgroundColor: 'var(--accent-a2)', borderRadius: 'var(--radius-3)', padding: 'var(--space-4)' }}>
          {children(syncSettings)}
        </Box>
      </Box>
    </Theme>
  );
}