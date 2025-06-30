import type { Meta, StoryObj } from '@storybook/react';
import { RegexPresetCard } from './RegexPresetCard';
import { RegexPresetsTheme } from '../themes';
import type { RegexPresetSetting } from '../../types/syncSettings';

const meta = {
  title: 'Components/RegexPresetCard',
  component: RegexPresetCard,
  parameters: {
    layout: 'padded',
    viewport: {
      defaultViewport: 'responsive',
    },
  },
  decorators: [
    (Story) => (
      <RegexPresetsTheme>
        <div style={{ width: '100%', minWidth: '600px', padding: '20px' }}>
          <Story />
        </div>
      </RegexPresetsTheme>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof RegexPresetCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockPreset: RegexPresetSetting = {
  id: '1',
  name: 'Issue Tracker',
  titleParsingRegEx: '([A-Z]+-\\d+)',
  urlParsingRegEx: '/browse/([A-Z]+-\\d+)'
};

export const RegexPresetCardDefault: Story = {
  args: {
    preset: mockPreset,
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
    onCopy: () => console.log('Copy clicked'),
    onPaste: () => console.log('Paste clicked'),
    isPasteAvailable: true
  }
};

export const RegexPresetCardPasteNotAvailable: Story = {
  args: {
    ...RegexPresetCardDefault.args,
    isPasteAvailable: false
  }
};

export const RegexPresetCardNoUrlRegex: Story = {
  args: {
    ...RegexPresetCardDefault.args,
    preset: {
      ...mockPreset,
      name: 'Simple Pattern',
      titleParsingRegEx: '\\d{4}-\\d{2}-\\d{2}',
      urlParsingRegEx: ''
    }
  }
};

export const RegexPresetCardComplexPattern: Story = {
  args: {
    ...RegexPresetCardDefault.args,
    preset: {
      ...mockPreset,
      name: 'Email Extraction',
      titleParsingRegEx: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
      urlParsingRegEx: '/user/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})'
    }
  }
};

export const RegexPresetCardWithBadge: Story = {
  args: {
    ...RegexPresetCardDefault.args,
    badge: {
      text: 'New',
      color: 'green'
    }
  }
};

export const RegexPresetCardWithWarningBadge: Story = {
  args: {
    ...RegexPresetCardDefault.args,
    badge: {
      text: 'Deprecated',
      color: 'orange'
    }
  }
};

export const RegexPresetCardWithErrorBadge: Story = {
  args: {
    ...RegexPresetCardDefault.args,
    badge: {
      text: 'Invalid',
      color: 'red'
    }
  }
};