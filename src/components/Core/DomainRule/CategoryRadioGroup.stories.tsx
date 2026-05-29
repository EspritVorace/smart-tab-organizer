import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Box } from '@radix-ui/themes';
import { CategoryRadioGroup } from './CategoryRadioGroup';

const meta: Meta<typeof CategoryRadioGroup> = {
  title: 'Components/Core/DomainRule/CategoryRadioGroup',
  component: CategoryRadioGroup,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <Box style={{ width: 480, padding: 'var(--space-3)' }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledExample({ initial }: { initial: string | null }) {
  const [value, setValue] = useState<string | null>(initial);
  return <CategoryRadioGroup value={value} onChange={setValue} />;
}

export const CategoryRadioGroupDefault: Story = {
  render: () => <ControlledExample initial={null} />,
};

export const CategoryRadioGroupSelected: Story = {
  render: () => <ControlledExample initial="development" />,
};

export const CategoryRadioGroupNoneSelected: Story = {
  render: () => <ControlledExample initial={null} />,
};

export const CategoryRadioGroupNarrowContainer: Story = {
  decorators: [
    (Story) => (
      <Box style={{ width: 380, padding: 'var(--space-3)' }}>
        <Story />
      </Box>
    ),
  ],
  render: () => <ControlledExample initial="productivity" />,
};
