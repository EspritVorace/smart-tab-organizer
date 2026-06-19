import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import { setRegexFieldValue } from '@/components/UI/RegexCodeField';
import { DomainRuleConfigForm, type DomainRuleConfigFormProps } from './DomainRuleConfigForm';
import type { ConfigMode } from './ConfigModeSelector';
import type { GroupNameSourceValue, UrlExtractionModeValue } from '@/schemas/enums';
import type { PresetCategory } from '@/types/preset';

// Minimal catalog mixing a domain-specific preset with a cross-domain ("*") one
// so the leading "Suggested for this domain" group can be demonstrated.
const SAMPLE_PRESET_CATEGORIES: PresetCategory[] = [
  {
    id: 'development',
    presets: [
      {
        id: 'github-issue',
        name: 'GitHub Issue',
        domainFilters: ['github.com'],
        groupNameSource: 'smart',
        description: '',
      },
      {
        id: 'numeric-id',
        name: 'Numeric ID',
        domainFilters: ['*'],
        groupNameSource: 'smart',
        description: '',
      },
    ],
  },
] as PresetCategory[];

type WrapperProps = Omit<
  DomainRuleConfigFormProps,
  | 'configMode' | 'onConfigModeChange'
  | 'groupNameSource' | 'onGroupNameSourceChange'
  | 'titleParsingRegEx' | 'onTitleParsingRegExChange'
  | 'urlParsingRegEx' | 'onUrlParsingRegExChange'
  | 'urlExtractionMode' | 'onUrlExtractionModeChange'
  | 'urlQueryParamName' | 'onUrlQueryParamNameChange'
> & { initialMode?: ConfigMode };

function Wrapper(props: WrapperProps) {
  const { initialMode = 'preset', ...rest } = props;
  const [configMode, setConfigMode] = useState<ConfigMode>(initialMode);
  const [groupNameSource, setGroupNameSource] = useState<GroupNameSourceValue>('title');
  const [titleRegex, setTitleRegex] = useState('');
  const [urlRegex, setUrlRegex] = useState('');
  const [extractionMode, setExtractionMode] = useState<UrlExtractionModeValue>('regex');
  const [queryParamName, setQueryParamName] = useState('');

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
        urlExtractionMode={extractionMode}
        onUrlExtractionModeChange={setExtractionMode}
        urlQueryParamName={queryParamName}
        onUrlQueryParamNameChange={setQueryParamName}
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

// Preset mode with a step 1 domain that matches a domain-specific preset: a
// leading "Suggested for this domain" group is prepended to the library.
export const DomainRuleConfigFormPresetSuggested: Story = {
  render: () => (
    <Wrapper
      presetId={null}
      onPresetChange={() => {}}
      presetCategories={SAMPLE_PRESET_CATEGORIES}
      isLoadingPresets={false}
      suggestionDomain="github.com"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The leading group heading is shown, and the matching preset moves into it.
    await expect(canvas.getByText('Suggested for this domain')).toBeInTheDocument();
    await expect(canvas.getByText('GitHub Issue')).toBeInTheDocument();
  },
};

// Preset mode with a non-matching domain: no leading group, library as today.
export const DomainRuleConfigFormPresetNoSuggestion: Story = {
  render: () => (
    <Wrapper
      presetId={null}
      onPresetChange={() => {}}
      presetCategories={SAMPLE_PRESET_CATEGORIES}
      isLoadingPresets={false}
      suggestionDomain="example.com"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText('Suggested for this domain')).not.toBeInTheDocument();
    // The cross-domain preset stays available in its usual section.
    await expect(canvas.getByText('Numeric ID')).toBeInTheDocument();
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
    // The title regex field is a single-line CodeMirror editor (no <input>);
    // drive it through the dispatch seam rather than userEvent.type.
    await setRegexFieldValue(canvasElement, 'title-regex-field', '^(?<id>\\d+)-(.+)$');
    await waitFor(() => {
      const content = canvas.getByTestId('title-regex-field').querySelector('.cm-content');
      expect(content?.textContent).toContain('(?<id>');
    });
  },
};
