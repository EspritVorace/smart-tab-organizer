import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, expect, waitFor } from 'storybook/test';
import { DomainCodeField } from './DomainCodeField';

interface HarnessProps {
  initialValue: string;
  hasError?: boolean;
}

function DomainFieldHarness({ initialValue, hasError }: HarnessProps) {
  const [value, setValue] = useState(initialValue);
  return (
    <div style={{ width: 360 }}>
      <DomainCodeField
        value={value}
        onChange={setValue}
        ariaLabel="Domain filter editor"
        placeholder="e.g., atlassian.net"
        hasError={hasError}
      />
    </div>
  );
}

const meta: Meta<typeof DomainFieldHarness> = {
  title: 'Components/UI/DomainCodeField',
  component: DomainFieldHarness,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DomainCodeFieldEmpty: Story = {
  args: { initialValue: '' },
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByTestId('domain-code-field');
    await waitFor(() => expect(field.querySelector('.cm-content')).not.toBeNull());
    const content = field.querySelector<HTMLElement>('.cm-content');
    expect(content?.getAttribute('aria-label')).toBe('Domain filter editor');
    expect(content?.getAttribute('spellcheck')).toBe('false');
  },
};

export const DomainCodeFieldPlainDomain: Story = {
  // Exercises subdomain + domain + tld + dot coloring.
  args: { initialValue: 'mail.google.com' },
};

export const DomainCodeFieldSubdomainCompound: Story = {
  // Compound public suffix (co.uk) plus a multi-label subdomain.
  args: { initialValue: 'a.b.example.co.uk' },
};

export const DomainCodeFieldRegexValueNeutral: Story = {
  // Not a plain domain: stays neutral (no coloring), no error.
  args: { initialValue: 'github\\.com' },
};

export const DomainCodeFieldWithError: Story = {
  args: { initialValue: 'example', hasError: true },
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByTestId('domain-code-field');
    await waitFor(() => {
      expect(field.querySelector('.cm-content')?.getAttribute('aria-invalid')).toBe('true');
    });
  },
};
