import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { OptionsFooter, OptionsFooterCollapsed } from './OptionsFooter';

const meta: Meta<typeof OptionsFooter> = {
  title: 'Components/UI/OptionsLayout/OptionsFooter',
  component: OptionsFooter,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const OptionsFooterDefault: Story = {};

export const OptionsFooterCollapsedStory: Story = {
  render: () => React.createElement(OptionsFooterCollapsed),
  name: 'Collapsed',
};
