import React from 'react';
import { Theme, Heading, Box } from '@radix-ui/themes';
import { getMessage } from '../../../utils/i18n';
import { FEATURE_THEMES } from '../../../utils/themeConstants.js';
import type { SyncSettings } from '../../../types/syncSettings.js';
import type { FeatureTheme } from '../../../utils/themeConstants.js';

interface PageLayoutProps {
  titleKey: string;
  theme: FeatureTheme;
  syncSettings: SyncSettings;
  children: (settings: SyncSettings) => React.ReactNode;
}

export function PageLayout({ titleKey, theme, syncSettings, children }: PageLayoutProps) {
  return (
    <Theme accentColor={FEATURE_THEMES[theme]}>
      <Box style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        padding: '20px'
      }}>
        <Heading size="9" as="h1" style={{ marginBottom: '24px' }}>
          {getMessage(titleKey)}
        </Heading>
        <Box style={{ flex: 1 }}>
          {children(syncSettings)}
        </Box>
      </Box>
    </Theme>
  );
}