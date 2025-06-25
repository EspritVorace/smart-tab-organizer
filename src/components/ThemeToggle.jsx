import React from 'react';
import { useTheme } from 'next-themes';
import { Select, Text, Flex } from '@radix-ui/themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { getMessage } from '../utils/i18n.js';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const themeOptions = [
        { value: 'light', labelKey: 'lightMode', icon: Sun },
        { value: 'dark', labelKey: 'darkModeOption', icon: Moon },
        { value: 'system', labelKey: 'systemTheme', icon: Monitor }
    ];

    return (
        <Select.Root value={theme} onValueChange={setTheme}>
            <Select.Trigger>
                <Flex align="center" gap="2">
                    {themeOptions.find(option => option.value === theme)?.icon && 
                        React.createElement(themeOptions.find(option => option.value === theme).icon, { size: 16 })
                    }
                    <Text>
                        {getMessage(themeOptions.find(option => option.value === theme)?.labelKey || 'darkMode')}
                    </Text>
                </Flex>
            </Select.Trigger>
            <Select.Content position="popper" side="bottom">
                {themeOptions.map((option) => (
                    <Select.Item key={option.value} value={option.value}>
                        <Flex align="center" gap="2">
                            {React.createElement(option.icon, { size: 16 })}
                            <Text>{getMessage(option.labelKey)}</Text>
                        </Flex>
                    </Select.Item>
                ))}
            </Select.Content>
        </Select.Root>
    );
}