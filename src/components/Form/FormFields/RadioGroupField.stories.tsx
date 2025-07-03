import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { RadioGroupField } from './RadioGroupField';

const meta: Meta<typeof RadioGroupField> = {
  title: 'Components/Form/FormFields/RadioGroupField',
  component: RadioGroupField,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockOptions = [
  { value: 'option1', keyLabel: 'groupNameSourceTitle' },
  { value: 'option2', keyLabel: 'groupNameSourceUrl' },
  { value: 'option3', keyLabel: 'groupNameSourceManual' },
] as const;

function RadioGroupFieldWrapper(args: any) {
  const { control } = useForm({
    defaultValues: {
      testField: 'option1'
    }
  });

  return (
    <RadioGroupField
      {...args}
      name="testField"
      control={control}
    />
  );
}

export const RadioGroupFieldDefault: Story = {
  render: (args) => <RadioGroupFieldWrapper {...args} />,
  args: {
    label: 'Choose Option',
    options: mockOptions,
    required: false,
  },
};

export const RadioGroupFieldRequired: Story = {
  render: (args) => <RadioGroupFieldWrapper {...args} />,
  args: {
    label: 'Required Choice',
    options: mockOptions,
    required: true,
  },
};