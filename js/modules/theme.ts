// js/modules/theme.js
let systemThemeListener = null;
export function applyTheme(preference: 'enabled' | 'disabled' | 'system'): void {
    const docElement = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => {
        docElement.classList.remove('dark-mode', 'light-mode');
        let useDark = (preference === 'enabled') || (preference === 'system' && mediaQuery.matches);
        docElement.classList.add(useDark ? 'dark-mode' : 'light-mode');
    };
    if (systemThemeListener) mediaQuery.removeEventListener('change', systemThemeListener);
    if (preference === 'system') { systemThemeListener = update; mediaQuery.addEventListener('change', systemThemeListener); }
    update();
}