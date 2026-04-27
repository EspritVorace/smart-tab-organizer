import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { OptionsHeader, OptionsHeaderCollapsed } from './OptionsHeader';

const metaExpanded: Meta<typeof OptionsHeader> = {
  title: 'Components/UI/OptionsLayout/OptionsHeader',
  component: OptionsHeader,
  parameters: { layout: 'centered' },
};

export default metaExpanded;
type Story = StoryObj<typeof metaExpanded>;

export const OptionsHeaderDefault: Story = {
  args: {
    version: '1.1.3',
  },
};

export const OptionsHeaderCollapsedStory: Story = {
  render: () => React.createElement(OptionsHeaderCollapsed),
  name: 'Collapsed',
};
