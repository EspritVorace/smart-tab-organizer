import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, expect, waitFor } from 'storybook/test';
import { RegexCodeField } from './RegexCodeField';

interface HarnessProps {
  initialValue: string;
  hasError?: boolean;
}

function RegexFieldHarness({ initialValue, hasError }: HarnessProps) {
  const [value, setValue] = useState(initialValue);
  return (
    <div style={{ width: 360 }}>
      <RegexCodeField
        value={value}
        onChange={setValue}
        ariaLabel="Title regular expression editor"
        placeholder="(.+)"
        hasError={hasError}
      />
    </div>
  );
}

const meta: Meta<typeof RegexFieldHarness> = {
  title: 'Components/UI/RegexCodeField',
  component: RegexFieldHarness,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const RegexCodeFieldEmpty: Story = {
  args: { initialValue: '' },
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByTestId('regex-code-field');
    await waitFor(() => expect(field.querySelector('.cm-content')).not.toBeNull());
    const content = field.querySelector<HTMLElement>('.cm-content');
    expect(content?.getAttribute('aria-label')).toBe('Title regular expression editor');
    expect(content?.getAttribute('spellcheck')).toBe('false');
  },
};

export const RegexCodeFieldHighlighted: Story = {
  // Exercises groups, named groups, character classes, quantifiers, anchors,
  // alternation and escapes so every token color is visible.
  args: { initialValue: '^(?<id>\\d{2,4})-(foo|bar)?[A-Z]+\\s*$' },
};

export const RegexCodeFieldWithError: Story = {
  args: { initialValue: '(unclosed', hasError: true },
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByTestId('regex-code-field');
    await waitFor(() => {
      expect(field.querySelector('.cm-content')?.getAttribute('aria-invalid')).toBe('true');
    });
  },
};
