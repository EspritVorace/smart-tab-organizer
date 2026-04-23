import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from 'storybook/test';
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

// Types a tag name and presses Enter to add it.
export const TagInputFieldAddTag: Story = {
  render: () => (
    <TagInputFieldWrapper
      label="Ignored query parameters"
      placeholder="Press Enter or comma to add"
      helpText="Use * as a wildcard. Example: utm_*"
      removeTagAriaLabel="Remove parameter"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Ignored query parameters');
    await userEvent.type(input, 'utm_source{Enter}');
    await expect(canvas.getByText('utm_source')).toBeInTheDocument();
  },
};

// Adds a tag via comma separator.
export const TagInputFieldAddTagViaComma: Story = {
  render: () => (
    <TagInputFieldWrapper
      label="Ignored query parameters"
      placeholder="Press Enter or comma to add"
      helpText="Use * as a wildcard. Example: utm_*"
      removeTagAriaLabel="Remove parameter"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Ignored query parameters');
    await userEvent.type(input, 'fbclid,');
    await expect(canvas.getByText('fbclid')).toBeInTheDocument();
  },
};

// Removes a tag by clicking its remove button.
export const TagInputFieldRemoveTag: Story = {
  render: () => (
    <TagInputFieldWrapper
      initialValues={['utm_*', 'fbclid', 'gclid']}
      label="Ignored query parameters"
      placeholder="Press Enter or comma to add"
      helpText="Use * as a wildcard. Example: utm_*"
      removeTagAriaLabel="Remove parameter"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const removeBtn = canvas.getByRole('button', { name: /Remove parameter: fbclid/i });
    await userEvent.click(removeBtn);
    await expect(canvas.queryByText('fbclid')).not.toBeInTheDocument();
    await expect(canvas.getByText('utm_*')).toBeInTheDocument();
    await expect(canvas.getByText('gclid')).toBeInTheDocument();
  },
};

// Rejects an invalid tag when validateTag is set.
export const TagInputFieldRejectInvalid: Story = {
  render: () => (
    <TagInputFieldWrapper
      initialValues={[]}
      label="Ignored query parameters"
      placeholder="Try typing invalid chars like $ or /"
      helpText="Only alphanumeric + _ - . * are accepted."
      removeTagAriaLabel="Remove parameter"
      validateTag={/^[A-Za-z0-9_\-.*]+$/}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Ignored query parameters');
    await userEvent.type(input, 'bad$tag{Enter}');
    // Invalid tag should not be added (no tag chip rendered)
    await expect(canvas.queryByRole('listitem')).not.toBeInTheDocument();
  },
};
