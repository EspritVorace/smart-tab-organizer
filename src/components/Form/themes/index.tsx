import React from 'react';
import { Theme } from '@radix-ui/themes';
import { FEATURE_THEMES } from '../../../utils/themeConstants';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export function DomainRulesTheme({ children }: ThemeWrapperProps) {
  return <Theme accentColor={FEATURE_THEMES.DOMAIN_RULES}>{children}</Theme>;
}

export function RegexPresetsTheme({ children }: ThemeWrapperProps) {
  return <Theme accentColor={FEATURE_THEMES.REGEX_PRESETS}>{children}</Theme>;
}


export function ImportTheme({ children }: ThemeWrapperProps) {
  return <Theme accentColor={FEATURE_THEMES.IMPORT}>{children}</Theme>;
}

export function ExportTheme({ children }: ThemeWrapperProps) {
  return <Theme accentColor={FEATURE_THEMES.EXPORT}>{children}</Theme>;
}

export function StatisticsTheme({ children }: ThemeWrapperProps) {
  return <Theme accentColor={FEATURE_THEMES.STATISTICS}>{children}</Theme>;
}

export function SettingsTheme({ children }: ThemeWrapperProps) {
  return <Theme accentColor={FEATURE_THEMES.SETTINGS}>{children}</Theme>;
}