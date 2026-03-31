import { Box, Callout, Flex, Grid, HoverCard, SegmentedControl, Select, Text, TextField } from '@radix-ui/themes';
import { Info } from 'lucide-react';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { getMessage } from '../../../utils/i18n';
import { RegexPresetsTheme } from '../../Form/themes';
import { RegexPresetsCallouts } from '../../Form/themed-callouts';
import { FormField, SearchableSelect } from '../../Form/FormFields';
import { groupNameSourceOptions, type GroupNameSourceValue } from '../../../schemas/enums';
import type { DomainRule } from '../../../schemas/domainRule';
import type { PresetCategory } from '../../../utils/presetUtils';

interface WizardStep2ConfigProps {
  control: Control<DomainRule>;
  errors: FieldErrors<DomainRule>;
  configMode: 'preset' | 'ask' | 'manual';
  onConfigModeChange: (mode: 'preset' | 'ask' | 'manual') => void;
  presetCategories: PresetCategory[];
  isLoadingPresets: boolean;
  handlePresetChange: (presetId: string) => void;
  groupNameSource: GroupNameSourceValue;
}

export function WizardStep2Config({
  control,
  errors,
  configMode,
  onConfigModeChange,
  presetCategories,
  isLoadingPresets,
  handlePresetChange,
  groupNameSource,
}: WizardStep2ConfigProps) {
  return (
    <Flex direction="column" gap="4">
      {/* Info callout when presets are loading */}
      {isLoadingPresets && (
        <RegexPresetsCallouts.Info>
          {getMessage('loadingPresets')}
        </RegexPresetsCallouts.Info>
      )}

      {/* Configuration Mode Selection */}
      <Flex direction="column" gap="1">
        <Text as="label" size="2" weight="bold">
          {getMessage('configurationMode')}
        </Text>
        <SegmentedControl.Root
          value={configMode}
          onValueChange={(v) => onConfigModeChange(v as 'preset' | 'ask' | 'manual')}
          size="2"
        >
          {(['preset', 'ask', 'manual'] as const).map((mode) => (
            <SegmentedControl.Item key={mode} value={mode}>
              <Flex align="center" gap="1">
                {getMessage(({ preset: 'configModePreset', ask: 'configModeAsk', manual: 'configModeManual' } as const)[mode])}
                <HoverCard.Root openDelay={300} closeDelay={100}>
                  <HoverCard.Trigger>
                    <Box as="span" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'default', lineHeight: 0 }}>
                      <Info size={12} aria-hidden="true" />
                    </Box>
                  </HoverCard.Trigger>
                  <HoverCard.Content
                    size="1"
                    maxWidth="240px"
                    side="top"
                    sideOffset={4}
                    align={mode === 'manual' ? 'end' : 'center'}
                  >
                    <Text size="2">
                      {getMessage(({ preset: 'configModePresetHelp', ask: 'configModeAskHelp', manual: 'configModeManualHelp' } as const)[mode])}
                    </Text>
                  </HoverCard.Content>
                </HoverCard.Root>
              </Flex>
            </SegmentedControl.Item>
          ))}
        </SegmentedControl.Root>
      </Flex>

      {/* Preset Selection */}
      {configMode === 'preset' && presetCategories.length > 0 && !isLoadingPresets && (
        <Grid columns="2" gap="4">
          <RegexPresetsTheme>
            <Flex direction="column" gap="1">
              <Text as="label" htmlFor="presetId" size="2" weight="bold">
                {getMessage('presetRuleLabel')}
              </Text>
              <Controller
                name="presetId"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    id="presetId"
                    value={field.value ?? ''}
                    onValueChange={handlePresetChange}
                    groups={presetsToSearchableGroups(presetCategories)}
                    placeholder={getMessage('selectPresetPlaceholder')}
                    searchPlaceholder={getMessage('searchPresetPlaceholder')}
                    emptyMessage={getMessage('noPresetFound')}
                  />
                )}
              />
            </Flex>
          </RegexPresetsTheme>
          <Box />
        </Grid>
      )}

      {/* Ask mode — explanatory text */}
      {configMode === 'ask' && (
        <Callout.Root size="1" color="gray" variant="surface">
          <Callout.Icon><Info size={14} aria-hidden="true" /></Callout.Icon>
          <Callout.Text>{getMessage('configModeAskHelp')}</Callout.Text>
        </Callout.Root>
      )}

      {/* Manual mode — groupNameSource + conditional regex fields */}
      {configMode === 'manual' && (
        <Grid columns="2" gap="4">
          <Flex direction="column">
            <Text as="label" size="2" weight="bold">
              {getMessage('groupNameSource')}
            </Text>
            <Controller
              name="groupNameSource"
              control={control}
              render={({ field }) => (
                <Select.Root value={field.value} onValueChange={field.onChange}>
                  <Select.Trigger
                    placeholder={getMessage('selectGroupNameSource')}
                    style={{ marginTop: '4px' }}
                  />
                  <Select.Content>
                    {groupNameSourceOptions
                      .filter(option => option.value !== 'manual' && option.value !== 'smart_preset')
                      .map((option) => (
                        <Select.Item key={option.value} value={option.value}>
                          {getMessage(option.keyLabel)}
                        </Select.Item>
                      ))}
                  </Select.Content>
                </Select.Root>
              )}
            />
          </Flex>
          <Flex align="end">
            <Callout.Root size="1" color="gray" variant="surface">
              <Callout.Icon><Info size={14} aria-hidden="true" /></Callout.Icon>
              <Callout.Text>
                {getMessage(({
                  title: 'groupNameSourceTitleHelp',
                  url: 'groupNameSourceUrlHelp',
                  manual: 'groupNameSourceManualHelp',
                  smart: 'groupNameSourceSmartHelp',
                  smart_manual: 'groupNameSourceSmartManualHelp',
                  smart_preset: 'groupNameSourceSmartPresetHelp',
                  smart_label: 'groupNameSourceSmartLabelHelp',
                } as const)[groupNameSource])}
              </Callout.Text>
            </Callout.Root>
          </Flex>
        </Grid>
      )}

      {/* Title Parsing Regex */}
      {configMode === 'manual' && (groupNameSource === 'title' || groupNameSource.startsWith('smart')) && (
        <FormField
          label={getMessage('titleRegex')}
          required={true}
          error={errors.titleParsingRegEx}
        >
          <Controller
            name="titleParsingRegEx"
            control={control}
            render={({ field }) => (
              <TextField.Root
                {...field}
                name="titleParsingRegEx"
                placeholder="(.+)"
                style={{ marginTop: '4px' }}
              />
            )}
          />
        </FormField>
      )}

      {/* URL Parsing Regex */}
      {configMode === 'manual' && (groupNameSource === 'url' || groupNameSource.startsWith('smart')) && (
        <FormField
          label={getMessage('urlRegex')}
          required={true}
          error={errors.urlParsingRegEx}
        >
          <Controller
            name="urlParsingRegEx"
            control={control}
            render={({ field }) => (
              <TextField.Root
                {...field}
                name="urlParsingRegEx"
                placeholder="(.+)"
                style={{ marginTop: '4px' }}
              />
            )}
          />
        </FormField>
      )}
    </Flex>
  );
}

// Local helper (avoids importing from utils to keep the component self-contained)
function presetsToSearchableGroups(categories: PresetCategory[]) {
  return categories.map((cat) => ({
    label: cat.name,
    options: cat.presets.map((p) => ({
      value: p.id,
      label: p.name,
    })),
  }));
}
