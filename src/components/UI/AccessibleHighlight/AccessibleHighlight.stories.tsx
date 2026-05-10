import type { Meta, StoryObj } from '@storybook/react';
import { AccessibleHighlight } from './AccessibleHighlight';

const meta = {
  title: 'Components/UI/AccessibleHighlight/AccessibleHighlight',
  component: AccessibleHighlight,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    text: { control: 'text' },
    searchTerm: { control: 'text' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof AccessibleHighlight>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AccessibleHighlightNoSearch: Story = {
  args: {
    text: 'github.com/espritvorace/smart-tab-organizer',
    searchTerm: '',
  },
};

export const AccessibleHighlightSingleMatch: Story = {
  args: {
    text: 'github.com/espritvorace/smart-tab-organizer',
    searchTerm: 'smart',
  },
};

export const AccessibleHighlightMultipleMatches: Story = {
  args: {
    text: 'Open settings, check settings panel, save settings',
    searchTerm: 'settings',
  },
};

export const AccessibleHighlightCaseInsensitive: Story = {
  args: {
    text: 'Mozilla Firefox Developer Edition',
    searchTerm: 'firefox',
  },
};

export const AccessibleHighlightNoMatch: Story = {
  args: {
    text: 'github.com/espritvorace/smart-tab-organizer',
    searchTerm: 'notion',
  },
};

export const AccessibleHighlightWithClassName: Story = {
  args: {
    text: 'Visual Studio Code: editing evolved',
    searchTerm: 'code',
    className: 'rt-Text',
  },
};

/** "etude" matches "étude", "e" matches "é": accent-insensitive in both directions. */
export const AccessibleHighlightAccentFolding: Story = {
  args: {
    text: 'Répertoire des règles de déduplication',
    searchTerm: 'regle',
  },
};

/** The search term itself may carry accents and still find an unaccented version. */
export const AccessibleHighlightAccentFoldingReverse: Story = {
  args: {
    text: 'Repertoire des regles de deduplication',
    searchTerm: 'règle',
  },
};
