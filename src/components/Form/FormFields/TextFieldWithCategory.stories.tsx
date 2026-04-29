import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Box } from '@radix-ui/themes';
import { TextFieldWithCategory } from './TextFieldWithCategory';

const meta: Meta<typeof TextFieldWithCategory> = {
  title: 'Components/Form/FormFields/TextFieldWithCategory',
  component: TextFieldWithCategory,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <Box style={{ width: 400 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledExample({
  initialValue = '',
  initialCategoryId = null as string | null,
  ...rest
}: {
  initialValue?: string;
  initialCategoryId?: string | null;
  placeholder?: string;
  maxLength?: number;
  'aria-label'?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId);
  return (
    <TextFieldWithCategory
      value={value}
      onChange={setValue}
      categoryId={categoryId}
      onCategoryChange={setCategoryId}
      {...rest}
    />
  );
}

export const TextFieldWithCategoryDefault: Story = {
  render: () => <ControlledExample placeholder="Enter a label..." aria-label="Label" />,
};

export const TextFieldWithCategoryFilled: Story = {
  render: () => (
    <ControlledExample
      initialValue="My work session"
      initialCategoryId={'productivity'}
      aria-label="Label"
    />
  ),
};

export const TextFieldWithCategoryWithMaxLength: Story = {
  render: () => (
    <ControlledExample
      initialValue="A quite long session name example"
      maxLength={100}
      aria-label="Label"
    />
  ),
};
