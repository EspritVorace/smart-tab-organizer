import React from 'react';
import { Theme, Heading, Box, Flex } from '@radix-ui/themes';
import { getMessage } from '../../../utils/i18n';
import { FEATURE_THEMES } from '../../../utils/themeConstants.js';
import type { SyncSettings } from '../../../types/syncSettings.js';
import type { FeatureTheme } from '../../../utils/themeConstants.js';

interface PageLayoutProps {
  titleKey: string;
  theme: FeatureTheme;
  syncSettings: SyncSettings;
  children: (settings: SyncSettings) => React.ReactNode;
  headerActions?: React.ReactNode; // Add this line
}

export function PageLayout({ titleKey, theme, syncSettings, children, headerActions }: PageLayoutProps) {
  return (
    <Theme accentColor={FEATURE_THEMES[theme]}>
      <Box style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column'
      }}>
        <Flex justify="between" align="center" style={{ marginBottom: '16px' }}>
          <Heading size="6" as="h1">
            {getMessage(titleKey)}
          </Heading>
          {headerActions && <Box>{headerActions}</Box>}
        </Flex>
        <Box style={{ flex: 1, overflow: 'auto' }}>
          {children(syncSettings)}
        </Box>
      </Box>
    </Theme>
  );
}