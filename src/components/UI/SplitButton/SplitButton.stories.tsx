import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Box, Theme } from '@radix-ui/themes';
import { Monitor, Replace, Square, Wrench } from 'lucide-react';
import { SplitButton, type SplitButtonRadioGroupConfig } from './SplitButton';

const noop = () => {};

const baseMenuItems = [
  { label: 'Restore in current window', icon: <Monitor size={14} />, onClick: noop, shortcut: 'Shift+R', 'data-testid': 'split-menu-current' },
  { label: 'Restore in new window', icon: <Square size={14} />, onClick: noop, shortcut: 'Alt+Shift+R', 'data-testid': 'split-menu-new' },
  { label: 'Replace tabs in current window', icon: <Replace size={14} />, onClick: noop, shortcut: 'Alt+R', 'data-testid': 'split-menu-replace' },
  { label: 'Customized restoration...', icon: <Wrench size={14} />, onClick: noop, shortcut: 'R', 'data-testid': 'split-menu-customize' },
];

function RadioGroupSplitButton({ initialValue = 'current' }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  const radioGroup: SplitButtonRadioGroupConfig = {
    label: 'Default action',
    value,
    onValueChange: setValue,
    options: [
      { value: 'current', label: 'Restore in current window', 'data-testid': 'split-default-current' },
      { value: 'new', label: 'Restore in new window', 'data-testid': 'split-default-new' },
      { value: 'replace', label: 'Replace tabs in current window', 'data-testid': 'split-default-replace' },
      { value: 'customize', label: 'Customized restoration...', 'data-testid': 'split-default-customize' },
    ],
  };
  return (
    <SplitButton
      label="Restore"
      primaryAriaLabel="Restore"
      onClick={noop}
      menuItems={baseMenuItems}
      radioGroup={radioGroup}
      variant="soft"
    />
  );
}

const meta: Meta<typeof SplitButton> = {
  title: 'Components/UI/SplitButton',
  component: SplitButton,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <Theme>
        <Box style={{ padding: 16 }}>
          <Story />
        </Box>
      </Theme>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SplitButtonDefault: Story = {
  args: {
    label: 'Export',
    onClick: noop,
    menuItems: [
      { label: 'Download file', onClick: noop, 'data-testid': 'split-export-file' },
      { label: 'Copy to clipboard', onClick: noop, 'data-testid': 'split-export-clipboard' },
    ],
    variant: 'soft',
  },
};

export const SplitButtonDisabled: Story = {
  args: {
    ...SplitButtonDefault.args,
    disabled: true,
    disabledReason: 'Nothing to export',
  },
};

export const SplitButtonWithRadioGroup: Story = {
  render: () => <RadioGroupSplitButton initialValue="current" />,
};

export const SplitButtonWithRadioGroupNew: Story = {
  render: () => <RadioGroupSplitButton initialValue="new" />,
};

export const SplitButtonWithRadioGroupReplace: Story = {
  render: () => <RadioGroupSplitButton initialValue="replace" />,
};

export const SplitButtonWithRadioGroupCustomize: Story = {
  render: () => <RadioGroupSplitButton initialValue="customize" />,
};
