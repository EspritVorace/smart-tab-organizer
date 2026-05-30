import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { StatusBar } from './StatusBar';
import { ShortcutsControlProvider } from '@/contexts/ShortcutsControlContext';

const meta: Meta<typeof StatusBar> = {
  title: 'Components/UI/StatusBar/StatusBar',
  component: StatusBar,
  parameters: { layout: 'padded' },
  render: () => (
    <ShortcutsControlProvider openShortcuts={() => undefined}>
      <div style={{ width: 480, border: '1px dashed var(--gray-a5)' }}>
        <StatusBar />
      </div>
    </ShortcutsControlProvider>
  ),
};

export default meta;
type Story = StoryObj<typeof StatusBar>;

export const StatusBarDefault: Story = {};
