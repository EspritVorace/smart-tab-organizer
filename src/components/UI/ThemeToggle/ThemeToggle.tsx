import React from 'react';
import { Flex, IconButton, Kbd, Tooltip } from '@radix-ui/themes';
import { Sun, Moon, Monitor, LucideProps } from 'lucide-react';
import { useThemeCycle, type ThemeValue } from '@/hooks/useThemeCycle';
import { getMessage } from '@/utils/i18n';

interface ThemeMeta {
  labelKey: string;
  icon: React.ComponentType<LucideProps>;
}

const THEME_META: Record<ThemeValue, ThemeMeta> = {
  light: { labelKey: 'lightMode', icon: Sun },
  dark: { labelKey: 'darkModeOption', icon: Moon },
  system: { labelKey: 'systemTheme', icon: Monitor },
};

export function ThemeToggle() {
  const { theme, cycleTheme } = useThemeCycle();

  const currentMeta = THEME_META[theme];
  const CurrentIcon = currentMeta.icon;
  const label = getMessage(currentMeta.labelKey);

  return (
    <Tooltip
      content={
        <Flex align="center" gap="2" aria-hidden="true">
          {label}
          <Kbd>D</Kbd>
        </Flex>
      }
    >
      <IconButton
        data-testid="theme-toggle"
        variant="ghost"
        size="2"
        onClick={cycleTheme}
        aria-label={label}
        aria-keyshortcuts="D"
        style={{ color: 'var(--gray-11)' }}
      >
        <CurrentIcon size={16} aria-hidden="true" />
      </IconButton>
    </Tooltip>
  );
}
