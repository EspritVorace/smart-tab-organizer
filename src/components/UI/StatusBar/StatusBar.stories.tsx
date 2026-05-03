import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { StatusBar } from './StatusBar';
import { ShortcutsControlProvider } from '@/contexts/ShortcutsControlContext';

interface StatusBarStoryArgs {
  version: string;
}

const meta: Meta<StatusBarStoryArgs> = {
  title: 'Components/UI/StatusBar/StatusBar',
  component: StatusBar,
  parameters: { layout: 'padded' },
  args: { version: '1.1.4' },
  render: ({ version }) => (
    <ShortcutsControlProvider openShortcuts={() => undefined} version={version}>
      <div style={{ width: 480, border: '1px dashed var(--gray-a5)' }}>
        <StatusBar />
      </div>
    </ShortcutsControlProvider>
  ),
};

export default meta;
type Story = StoryObj<StatusBarStoryArgs>;

export const StatusBarDefault: Story = {};

export const StatusBarShortVersion: Story = {
  args: { version: '2.0.0' },
};
