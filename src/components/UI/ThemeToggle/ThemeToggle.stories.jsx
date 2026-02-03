import React, { useState } from 'react';
import { IconButton, Tooltip } from '@radix-ui/themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Theme } from '@radix-ui/themes';
import { getMessage } from '../../../utils/i18n';

// Version mock du ThemeToggle pour Storybook
function MockThemeToggle({ initialTheme = 'light' }) {
    const [theme, setTheme] = useState(initialTheme);

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
            >
                <CurrentIcon size={16} />
            </IconButton>
        </Tooltip>
    );
}

export default {
    title: 'Components/UI/ThemeToggle',
    component: MockThemeToggle,
    decorators: [
        (Story) => (
            <Theme>
                <div style={{ padding: '20px' }}>
                    <Story />
                </div>
            </Theme>
        ),
    ],
};

export const ThemeToggleLight = () => <MockThemeToggle initialTheme="light" />;

export const ThemeToggleDark = () => <MockThemeToggle initialTheme="dark" />;

export const ThemeToggleSystem = () => <MockThemeToggle initialTheme="system" />;

export const ThemeToggleInteractive = () => <MockThemeToggle />;

export const ThemeToggleInHeader = () => (
    <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        padding: '12px',
        border: '1px solid var(--gray-6)',
        borderRadius: '8px'
    }}>
        <span>Theme:</span>
        <MockThemeToggle />
    </div>
);