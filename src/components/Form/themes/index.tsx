import React from 'react';
import { Theme } from '@radix-ui/themes';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export function DomainRulesTheme({ children }: ThemeWrapperProps) {
  return <Theme>{children}</Theme>;
}

export function RegexPresetsTheme({ children }: ThemeWrapperProps) {
  return <Theme>{children}</Theme>;
}

export function ImportTheme({ children }: ThemeWrapperProps) {
  return <Theme>{children}</Theme>;
}

export function ExportTheme({ children }: ThemeWrapperProps) {
  return <Theme>{children}</Theme>;
}

export function StatisticsTheme({ children }: ThemeWrapperProps) {
  return <Theme>{children}</Theme>;
}

export function SettingsTheme({ children }: ThemeWrapperProps) {
  return <Theme>{children}</Theme>;
}

export function SessionsTheme({ children }: ThemeWrapperProps) {
  return <Theme>{children}</Theme>;
}