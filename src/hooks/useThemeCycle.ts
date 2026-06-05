/**
 * Shared source of truth for the theme switch cycle (Light -> Dark ->
 * System). Both the header `ThemeToggle` button and the global `D` keyboard
 * shortcut consume this hook so the click action and the shortcut stay in
 * sync. Wraps `next-themes`.
 */

import { useCallback } from 'react';
import { useTheme } from 'next-themes';

export type ThemeValue = 'light' | 'dark' | 'system';

export const THEME_CYCLE: ThemeValue[] = ['light', 'dark', 'system'];

export function useThemeCycle(): { theme: ThemeValue; cycleTheme: () => void } {
  const { theme, setTheme } = useTheme();
  const current: ThemeValue = THEME_CYCLE.includes(theme as ThemeValue)
    ? (theme as ThemeValue)
    : 'system';

  const cycleTheme = useCallback(() => {
    const index = THEME_CYCLE.indexOf(current);
    setTheme(THEME_CYCLE[(index + 1) % THEME_CYCLE.length]);
  }, [current, setTheme]);

  return { theme: current, cycleTheme };
}
