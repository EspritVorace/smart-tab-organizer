import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';
import { useForm, type Control, type FieldValues } from 'react-hook-form';
import { RadioGroupField } from './RadioGroupField';

type RadioGroupFieldArgs = Omit<ComponentProps<typeof RadioGroupField>, 'name' | 'control'>;

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

function RadioGroupFieldWrapper({ label, options, required, onChange }: RadioGroupFieldArgs) {
  const { control } = useForm({
    defaultValues: {
      testField: 'option1'
    }
  });

  return (
    <RadioGroupField
      label={label}
      options={options}
      required={required}
      onChange={onChange}
      name="testField"
      control={control as unknown as Control<FieldValues>}
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
