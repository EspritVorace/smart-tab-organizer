import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from 'storybook/test';
import { DomainRuleConfigForm, type DomainRuleConfigFormProps } from './DomainRuleConfigForm';
import type { ConfigMode } from './ConfigModeSelector';
import type { GroupNameSourceValue } from '@/schemas/enums';

type WrapperProps = Omit<
  DomainRuleConfigFormProps,
  | 'configMode' | 'onConfigModeChange'
  | 'groupNameSource' | 'onGroupNameSourceChange'
  | 'titleParsingRegEx' | 'onTitleParsingRegExChange'
  | 'urlParsingRegEx' | 'onUrlParsingRegExChange'
> & { initialMode?: ConfigMode };

function Wrapper(props: WrapperProps) {
  const { initialMode = 'preset', ...rest } = props;
  const [configMode, setConfigMode] = useState<ConfigMode>(initialMode);
  const [groupNameSource, setGroupNameSource] = useState<GroupNameSourceValue>('title');
  const [titleRegex, setTitleRegex] = useState('');
  const [urlRegex, setUrlRegex] = useState('');

  return (
    <div style={{ width: 400, padding: 16 }}>
      <DomainRuleConfigForm
        {...rest}
        configMode={configMode}
        onConfigModeChange={setConfigMode}
        groupNameSource={groupNameSource}
        onGroupNameSourceChange={setGroupNameSource}
        titleParsingRegEx={titleRegex}
        onTitleParsingRegExChange={setTitleRegex}
        urlParsingRegEx={urlRegex}
        onUrlParsingRegExChange={setUrlRegex}
      />
    </div>
  );
}

const meta: Meta = {
  title: 'Components/Core/DomainRule/DomainRuleConfigForm',
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DomainRuleConfigFormPreset: Story = {
  render: () => (
    <Wrapper
      presetId={null}
      onPresetChange={() => {}}
      presetCategories={[]}
      isLoadingPresets={false}
    />
  ),
};

export const DomainRuleConfigFormLoading: Story = {
  render: () => (
    <Wrapper
      presetId={null}
      onPresetChange={() => {}}
      presetCategories={[]}
      isLoadingPresets={true}
    />
  ),
};

// Switches from Preset mode to Manual mode.
export const DomainRuleConfigFormSwitchToManual: Story = {
  render: () => (
    <Wrapper
      presetId={null}
      onPresetChange={() => {}}
      presetCategories={[]}
      isLoadingPresets={false}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const manualBtn = canvas.getByRole('radio', { name: /manual/i });
    await userEvent.click(manualBtn);
    await expect(canvas.getByRole('radio', { name: /manual/i })).toBeChecked();
  },
};

// Switches to Ask mode.
export const DomainRuleConfigFormSwitchToAsk: Story = {
  render: () => (
    <Wrapper
      presetId={null}
      onPresetChange={() => {}}
      presetCategories={[]}
      isLoadingPresets={false}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const askBtn = canvas.getByRole('radio', { name: /ask/i });
    await userEvent.click(askBtn);
    await expect(canvas.getByRole('radio', { name: /ask/i })).toBeChecked();
  },
};

// Opens in Manual mode and fills in a title regex.
export const DomainRuleConfigFormManualWithRegex: Story = {
  render: () => (
    <Wrapper
      initialMode="manual"
      presetId={null}
      onPresetChange={() => {}}
      presetCategories={[]}
      isLoadingPresets={false}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const inputs = canvas.getAllByRole('textbox');
    if (inputs.length > 0) {
      await userEvent.clear(inputs[0]);
      await userEvent.type(inputs[0], '(.+)');
    }
  },
};
