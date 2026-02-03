import React from 'react';
import { useTheme } from 'next-themes';
import { IconButton, Tooltip } from '@radix-ui/themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { getMessage } from '../../../utils/i18n';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const themeOptions = [
        { value: 'light', labelKey: 'lightMode', icon: Sun },
        { value: 'dark', labelKey: 'darkModeOption', icon: Moon },
        { value: 'system', labelKey: 'systemTheme', icon: Monitor }
    ];

    const handleThemeToggle = () => {
        const currentIndex = themeOptions.findIndex(option => option.value === theme);
        const nextIndex = (currentIndex + 1) % themeOptions.length;
        setTheme(themeOptions[nextIndex].value);
    };

    const currentTheme = themeOptions.find(option => option.value === theme) || themeOptions[0];
    const CurrentIcon = currentTheme.icon;

    return (
        <Tooltip content={getMessage(currentTheme.labelKey)}>
            <IconButton
                variant="ghost"
                size="2"
                onClick={handleThemeToggle}
                aria-label={getMessage(currentTheme.labelKey)}
                style={{ color: 'var(--gray-11)' }}
            >
                <CurrentIcon size={16} />
            </IconButton>
        </Tooltip>
    );
}