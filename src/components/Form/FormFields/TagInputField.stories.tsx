import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { TagInputField } from './TagInputField';

const meta: Meta<typeof TagInputField> = {
  title: 'Components/Form/FormFields/TagInputField',
  component: TagInputField,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

interface DemoForm {
  tags: string[];
}

function TagInputFieldWrapper({
  initialValues = [],
  validateTag,
  maxTags,
  label,
  placeholder,
  helpText,
  removeTagAriaLabel,
  required,
}: {
  initialValues?: string[];
  validateTag?: RegExp;
  maxTags?: number;
  label: string;
  placeholder?: string;
  helpText?: string;
  removeTagAriaLabel: string;
  required?: boolean;
}) {
  const { control } = useForm<DemoForm>({
    defaultValues: { tags: initialValues },
  });
  return (
    <div style={{ width: 360 }}>
      <TagInputField<DemoForm>
        name="tags"
        control={control}
        label={label}
        placeholder={placeholder}
        helpText={helpText}
        removeTagAriaLabel={removeTagAriaLabel}
        validateTag={validateTag}
        maxTags={maxTags}
        required={required}
      />
    </div>
  );
}

export const TagInputFieldDefault: Story = {
  render: () => (
    <TagInputFieldWrapper
      label="Ignored query parameters"
      placeholder="Press Enter or comma to add"
      helpText="Use * as a wildcard. Example: utm_*"
      removeTagAriaLabel="Remove parameter"
    />
  ),
};

export const TagInputFieldWithValues: Story = {
  render: () => (
    <TagInputFieldWrapper
      initialValues={['utm_*', 'fbclid', 'gclid']}
      label="Ignored query parameters"
      placeholder="Press Enter or comma to add"
      helpText="Use * as a wildcard. Example: utm_*"
      removeTagAriaLabel="Remove parameter"
    />
  ),
};

export const TagInputFieldWithValidation: Story = {
  render: () => (
    <TagInputFieldWrapper
      initialValues={['utm_*']}
      label="Ignored query parameters (alphanum + _ - . *)"
      placeholder="Try typing invalid chars like $ or /"
      helpText="Only alphanumeric + _ - . * are accepted."
      removeTagAriaLabel="Remove parameter"
      validateTag={/^[A-Za-z0-9_\-.*]+$/}
      maxTags={5}
      required
    />
  ),
};
