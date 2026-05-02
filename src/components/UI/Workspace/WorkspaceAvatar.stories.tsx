import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Flex } from '@radix-ui/themes';
import { WorkspaceAvatar } from './WorkspaceAvatar';
import { workspaceAccentColors } from '@/schemas/workspace';

const meta: Meta<typeof WorkspaceAvatar> = {
  title: 'Components/UI/Workspace/WorkspaceAvatar',
  component: WorkspaceAvatar,
  parameters: { layout: 'centered' },
  args: { name: 'Workspace', accentColor: 'indigo', size: 'md' },
  argTypes: {
    accentColor: { control: 'select', options: workspaceAccentColors },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WorkspaceAvatarDefault: Story = {};

export const WorkspaceAvatarSmall: Story = {
  args: { size: 'sm', name: 'Personal' },
};

export const WorkspaceAvatarLarge: Story = {
  args: { size: 'lg', name: 'Work Stuff' },
};

export const WorkspaceAvatarSingleWord: Story = {
  args: { name: 'Default' },
};

export const WorkspaceAvatarUnknown: Story = {
  args: { name: '' },
  name: 'Empty name (fallback "?")',
};

export const WorkspaceAvatarColorMatrix: Story = {
  render: () => (
    <Flex gap="3" wrap="wrap" style={{ maxWidth: 380 }}>
      {workspaceAccentColors.map((color) => (
        <WorkspaceAvatar key={color} name={color} accentColor={color} size="md" />
      ))}
    </Flex>
  ),
  name: 'All accent colors',
};
