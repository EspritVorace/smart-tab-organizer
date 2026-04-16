import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { IconButton, Tooltip, Theme } from '@radix-ui/themes';
import { Sun, Moon, Monitor, LucideProps } from 'lucide-react';
import { getMessage } from '@/utils/i18n';

interface ThemeOption {
  value: 'light' | 'dark' | 'system';
  labelKey: string;
  icon: React.ComponentType<LucideProps>;
}

interface MockThemeToggleProps {
  initialTheme?: 'light' | 'dark' | 'system';
}

// Version mock du ThemeToggle pour Storybook
function MockThemeToggle({ initialTheme = 'light' }: MockThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(initialTheme);

  const themeOptions: ThemeOption[] = [
    { value: 'light', labelKey: 'lightMode', icon: Sun },
    { value: 'dark', labelKey: 'darkModeOption', icon: Moon },
    { value: 'system', labelKey: 'systemTheme', icon: Monitor },
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
        <CurrentIcon size={16} aria-hidden="true" />
      </IconButton>
    </Tooltip>
  );
}

const meta: Meta<typeof MockThemeToggle> = {
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

export default meta;
type Story = StoryObj<typeof meta>;

export const ThemeToggleLight: Story = { args: { initialTheme: 'light' } };

export const ThemeToggleDark: Story = { args: { initialTheme: 'dark' } };

export const ThemeToggleSystem: Story = { args: { initialTheme: 'system' } };

export const ThemeToggleInteractive: Story = {};

export const ThemeToggleInHeader: Story = {
  render: () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      border: '1px solid var(--gray-6)',
      borderRadius: '8px',
    }}>
      <span>Theme:</span>
      <MockThemeToggle />
    </div>
  ),
};
