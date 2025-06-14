// js/modules/theme.js
import { setGlobalTheme } from '@atlaskit/tokens';

let systemThemeListener: ((ev: MediaQueryListEvent) => void) | null = null;

export function applyTheme(preference: 'enabled' | 'disabled' | 'system'): void {
    const docElement = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const update = () => {
        const useDark = (preference === 'enabled') || (preference === 'system' && mediaQuery.matches);
        docElement.classList.remove('dark-mode', 'light-mode');
        docElement.classList.add(useDark ? 'dark-mode' : 'light-mode');
        // Apply Atlassian design system theme tokens globally
        setGlobalTheme({ colorMode: useDark ? 'dark' : 'light' }).catch(() => {});
    };

    if (systemThemeListener) mediaQuery.removeEventListener('change', systemThemeListener);
    if (preference === 'system') {
        systemThemeListener = update;
        mediaQuery.addEventListener('change', systemThemeListener);
    }
    update();
}