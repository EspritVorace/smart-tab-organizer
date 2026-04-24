import { Box, Callout, Flex, Grid, Select, Text, TextField } from '@radix-ui/themes';
import * as Label from '@radix-ui/react-label';
import { Info } from 'lucide-react';
import type { FieldError } from 'react-hook-form';
import { getMessage } from '@/utils/i18n';
import { RegexPresetsTheme } from '@/components/Form/themes';
import { FormField, SearchableSelect } from '@/components/Form/FormFields';
import { groupNameSourceOptions, type GroupNameSourceValue } from '@/schemas/enums';
import type { PresetCategory } from '@/utils/presetUtils';
import { presetsToSearchableGroups } from '@/utils/presetsToSearchableGroups';
import { ConfigModeSelector, type ConfigMode } from './ConfigModeSelector';

const GROUP_NAME_SOURCE_HELP_KEYS: Record<GroupNameSourceValue, Parameters<typeof getMessage>[0]> = {
  title: 'groupNameSourceTitleHelp',
  url: 'groupNameSourceUrlHelp',
  manual: 'groupNameSourceManualHelp',
  smart: 'groupNameSourceSmartHelp',
  smart_manual: 'groupNameSourceSmartManualHelp',
  smart_preset: 'groupNameSourceSmartPresetHelp',
  smart_label: 'groupNameSourceSmartLabelHelp',
};

export interface DomainRuleConfigFormProps {
  configMode: ConfigMode;
  onConfigModeChange: (mode: ConfigMode) => void;
  presetId: string | null;
  onPresetChange: (presetId: string) => void;
  presetCategories: PresetCategory[];
  isLoadingPresets: boolean;
  groupNameSource: GroupNameSourceValue;
  onGroupNameSourceChange: (source: GroupNameSourceValue) => void;
  titleParsingRegEx: string;
  onTitleParsingRegExChange: (value: string) => void;
  titleParsingRegExError?: FieldError;
  urlParsingRegEx: string;
  onUrlParsingRegExChange: (value: string) => void;
  urlParsingRegExError?: FieldError;
  /** Optional prefix for field IDs to avoid collisions when multiple instances coexist. */
  idPrefix?: string;
}

/**
 * Presentational form for a domain rule configuration (mode + preset/manual fields).
 * Shared between ConfigEditModal (useState-driven) and WizardStep2Config (react-hook-form driven).
 */
export function DomainRuleConfigForm({
  configMode,
  onConfigModeChange,
  presetId,
  onPresetChange,
  presetCategories,
  isLoadingPresets,
  groupNameSource,
  onGroupNameSourceChange,
  titleParsingRegEx,
  onTitleParsingRegExChange,
  titleParsingRegExError,
  urlParsingRegEx,
  onUrlParsingRegExChange,
  urlParsingRegExError,
  idPrefix,
}: DomainRuleConfigFormProps) {
  const prefix = idPrefix ? `${idPrefix}-` : '';
  const presetInputId = `${prefix}presetId`;
  const groupNameSourceInputId = `${prefix}groupNameSource`;

  return (
    <Flex direction="column" gap="4">
      {/* Info callout when presets are loading */}
      {isLoadingPresets && (
        <Callout.Root color="cyan" variant="soft">
          <Callout.Icon>
            <Info />
          </Callout.Icon>
          <Callout.Text>{getMessage('loadingPresets')}</Callout.Text>
        </Callout.Root>
      )}

      {/* Configuration mode selector */}
      <ConfigModeSelector value={configMode} onValueChange={onConfigModeChange} />

      {/* Preset selection */}
      {configMode === 'preset' && presetCategories.length > 0 && !isLoadingPresets && (
        <Grid columns="2" gap="4">
          <RegexPresetsTheme>
            <Flex direction="column" gap="1">
              <Text size="2" weight="bold" asChild>
                <Label.Root htmlFor={presetInputId}>
                  {getMessage('presetRuleLabel')}
                </Label.Root>
              </Text>
              <SearchableSelect
                id={presetInputId}
                value={presetId ?? ''}
                onValueChange={onPresetChange}
                groups={presetsToSearchableGroups(presetCategories)}
                placeholder={getMessage('selectPresetPlaceholder')}
                searchPlaceholder={getMessage('searchPresetPlaceholder')}
                emptyMessage={getMessage('noPresetFound')}
              />
            </Flex>
          </RegexPresetsTheme>
          <Box />
        </Grid>
      )}

      {/* Ask mode : explanatory callout */}
      {configMode === 'ask' && (
        <Callout.Root size="1" color="gray" variant="surface">
          <Callout.Icon><Info size={14} aria-hidden="true" /></Callout.Icon>
          <Callout.Text>{getMessage('configModeAskHelp')}</Callout.Text>
        </Callout.Root>
      )}

      {/* Manual mode : groupNameSource selector + contextual help */}
      {configMode === 'manual' && (
        <Grid columns="2" gap="4">
          <Flex direction="column">
            <Text size="2" weight="bold" asChild>
              <Label.Root htmlFor={groupNameSourceInputId}>
                {getMessage('groupNameSource')}
              </Label.Root>
            </Text>
            <Select.Root
              value={groupNameSource}
              onValueChange={(v) => onGroupNameSourceChange(v as GroupNameSourceValue)}
            >
              <Select.Trigger
                id={groupNameSourceInputId}
                placeholder={getMessage('selectGroupNameSource')}
                style={{ marginTop: '4px' }}
              />
              <Select.Content>
                {groupNameSourceOptions
                  .filter((option) => option.value !== 'manual' && option.value !== 'smart_preset')
                  .map((option) => (
                    <Select.Item key={option.value} value={option.value}>
                      {getMessage(option.keyLabel)}
                    </Select.Item>
                  ))}
              </Select.Content>
            </Select.Root>
          </Flex>
          <Flex align="end">
            <Callout.Root size="1" color="gray" variant="surface">
              <Callout.Icon><Info size={14} aria-hidden="true" /></Callout.Icon>
              <Callout.Text>
                {getMessage(GROUP_NAME_SOURCE_HELP_KEYS[groupNameSource])}
              </Callout.Text>
            </Callout.Root>
          </Flex>
        </Grid>
      )}

      {/* Title parsing regex (manual mode with title-based source) */}
      {configMode === 'manual' && (groupNameSource === 'title' || groupNameSource.startsWith('smart')) && (
        <FormField
          label={getMessage('titleRegex')}
          required={true}
          error={titleParsingRegExError}
        >
          {(fieldId) => (
            <TextField.Root
              id={fieldId}
              value={titleParsingRegEx}
              onChange={(e) => onTitleParsingRegExChange(e.target.value)}
              name="titleParsingRegEx"
              placeholder="(.+)"
              style={{ marginTop: '4px' }}
            />
          )}
        </FormField>
      )}

      {/* URL parsing regex (manual mode with URL-based source) */}
      {configMode === 'manual' && (groupNameSource === 'url' || groupNameSource.startsWith('smart')) && (
        <FormField
          label={getMessage('urlRegex')}
          required={true}
          error={urlParsingRegExError}
        >
          {(fieldId) => (
            <TextField.Root
              id={fieldId}
              value={urlParsingRegEx}
              onChange={(e) => onUrlParsingRegExChange(e.target.value)}
              name="urlParsingRegEx"
              placeholder="(.+)"
              style={{ marginTop: '4px' }}
            />
          )}
        </FormField>
      )}
    </Flex>
  );
}
