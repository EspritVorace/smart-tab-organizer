import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { WorkspaceColorPicker } from './WorkspaceColorPicker';
import type { WorkspaceAccentColor } from '@/schemas/workspace';

const meta: Meta<typeof WorkspaceColorPicker> = {
  title: 'Components/UI/Workspace/WorkspaceColorPicker',
  component: WorkspaceColorPicker,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledPicker({ initial }: { initial: WorkspaceAccentColor }) {
  const [value, setValue] = useState<WorkspaceAccentColor>(initial);
  return <WorkspaceColorPicker value={value} onChange={setValue} ariaLabel="Pick a color" />;
}

export const WorkspaceColorPickerDefault: Story = {
  render: () => <ControlledPicker initial="indigo" />,
};

export const WorkspaceColorPickerJade: Story = {
  render: () => <ControlledPicker initial="jade" />,
  name: 'Initial: jade',
};

export const WorkspaceColorPickerCrimson: Story = {
  render: () => <ControlledPicker initial="crimson" />,
  name: 'Initial: crimson',
};
