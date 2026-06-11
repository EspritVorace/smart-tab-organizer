import { Box, Callout, Flex, Select, Text, TextField } from '@radix-ui/themes';
import * as Label from '@radix-ui/react-label';
import { Info } from 'lucide-react';
import type { FieldError } from 'react-hook-form';
import { getMessage } from '@/utils/i18n';
import { FormField, SearchableInlineList } from '@/components/Form/FormFields';
import {
  groupNameSourceOptions,
  urlExtractionModeOptions,
  type GroupNameSourceValue,
  type UrlExtractionModeValue,
} from '@/schemas/enums';
import type { PresetCategory } from '@/utils/presetUtils';
import { presetsToSearchableGroups } from '@/utils/presetsToSearchableGroups';
import { RegexCodeField } from '@/components/UI/RegexCodeField';
import { ConfigModeSelector, MODE_HELP_LABELS, type ConfigMode } from './ConfigModeSelector';

const GROUP_NAME_SOURCE_HELP_KEYS: Record<GroupNameSourceValue, Parameters<typeof getMessage>[0]> = {
  title: 'groupNameSourceTitleHelp',
  url: 'groupNameSourceUrlHelp',
  manual: 'groupNameSourceManualHelp',
  smart: 'groupNameSourceSmartHelp',
  smart_manual: 'groupNameSourceSmartManualHelp',
  smart_preset: 'groupNameSourceSmartPresetHelp',
  smart_label: 'groupNameSourceSmartLabelHelp',
  label: 'groupNameSourceLabelHelp',
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
  urlExtractionMode: UrlExtractionModeValue;
  onUrlExtractionModeChange: (mode: UrlExtractionModeValue) => void;
  urlQueryParamName: string;
  onUrlQueryParamNameChange: (value: string) => void;
  urlQueryParamNameError?: FieldError;
  /** Fallback group name used when extraction fails, or directly when configMode === 'label'. */
  fallbackLabel?: string;
  onFallbackLabelChange?: (value: string) => void;
  /** Optional prefix for field IDs to avoid collisions when multiple instances coexist. */
  idPrefix?: string;
  /** Forwards [data-autofocus] to the first interactive control (the active config mode radio). */
  autoFocusFirstField?: boolean;
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
  urlExtractionMode,
  onUrlExtractionModeChange,
  urlQueryParamName,
  onUrlQueryParamNameChange,
  urlQueryParamNameError,
  fallbackLabel,
  onFallbackLabelChange,
  idPrefix,
  autoFocusFirstField = false,
}: DomainRuleConfigFormProps) {
  const prefix = idPrefix ? `${idPrefix}-` : '';
  const presetInputId = `${prefix}presetId`;
  const groupNameSourceInputId = `${prefix}groupNameSource`;
  const urlExtractionModeInputId = `${prefix}urlExtractionMode`;
  const fallbackLabelInputId = `${prefix}fallbackLabel`;

  const showUrlSection =
    configMode === 'manual' && (groupNameSource === 'url' || groupNameSource.startsWith('smart'));

  return (
    <Flex direction="column" gap="4" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Info callout when presets are loading */}
      {isLoadingPresets && (
        <Callout.Root color="indigo" variant="soft">
          <Callout.Icon>
            <Info />
          </Callout.Icon>
          <Callout.Text>{getMessage('loadingPresets')}</Callout.Text>
        </Callout.Root>
      )}

      <Flex gap="4" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }} align="stretch">
        {/* Left column: vertical radio list */}
        <Box style={{ width: 240, flexShrink: 0 }}>
          <ConfigModeSelector
            value={configMode}
            onValueChange={onConfigModeChange}
            autoFocusFirstField={autoFocusFirstField}
          />
        </Box>

        {/* Right column: active-mode description heading + mode-specific content */}
        <Flex
          direction="column"
          gap="3"
          style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}
        >
          <Text size="2" color="gray" as="p" data-testid="config-mode-description">
            {getMessage(MODE_HELP_LABELS[configMode])}
          </Text>

          {/* Preset mode: inline cmdk palette filling the right column */}
          {configMode === 'preset' && presetCategories.length > 0 && !isLoadingPresets && (
            <Flex
              direction="column"
              gap="1"
              style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
            >
              <Text size="2" weight="bold" asChild>
                <Label.Root htmlFor={presetInputId}>
                  {getMessage('presetRuleLabel')}
                </Label.Root>
              </Text>
              <SearchableInlineList
                id={presetInputId}
                value={presetId ?? ''}
                onValueChange={onPresetChange}
                groups={presetsToSearchableGroups(presetCategories)}
                searchPlaceholder={getMessage('searchPresetPlaceholder')}
                emptyMessage={getMessage('noPresetFound')}
              />
            </Flex>
          )}

          {/* Ask mode: nothing extra, description above is sufficient. */}

          {/* Label mode: free-text fallback name used as group name without extraction. */}
          {configMode === 'label' && (
            <FormField label={getMessage('fallbackLabelField')}>
              {(fieldId) => (
                <Flex direction="column" gap="1" style={{ marginTop: '4px' }}>
                  <TextField.Root
                    id={fieldId || fallbackLabelInputId}
                    value={fallbackLabel ?? ''}
                    onChange={(e) => onFallbackLabelChange?.(e.target.value)}
                    name="fallbackLabel"
                    maxLength={100}
                    data-testid="config-fallback-label-input"
                  />
                  <Text size="1" color="gray">{getMessage('fallbackLabelFieldHelp')}</Text>
                </Flex>
              )}
            </FormField>
          )}

          {/* Manual mode: groupNameSource selector + contextual help below the field */}
          {configMode === 'manual' && (
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
                    .filter((option) => {
                      // Always keep the currently selected value visible so the trigger renders it,
                      // even if it would normally be excluded (e.g. 'smart_preset' inherited from a preset rule
                      // or the deprecated 'smart_label' on legacy rules).
                      if (option.value === groupNameSource) return true;
                      return option.value !== 'manual'
                        && option.value !== 'smart_preset'
                        && option.value !== 'smart_label'
                        && option.value !== 'label';
                    })
                    .map((option) => (
                      <Select.Item key={option.value} value={option.value}>
                        <span
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: 'var(--space-1)',
                          }}
                        >
                          <Text size="2" as="span">{getMessage(option.keyLabel)}</Text>
                          <Text
                            size="1"
                            color="gray"
                            as="span"
                            data-select-item-description
                          >
                            {getMessage(GROUP_NAME_SOURCE_HELP_KEYS[option.value])}
                          </Text>
                        </span>
                      </Select.Item>
                    ))}
                </Select.Content>
              </Select.Root>
              <Text size="1" color="gray" mt="1">
                {getMessage(GROUP_NAME_SOURCE_HELP_KEYS[groupNameSource])}
              </Text>
            </Flex>
          )}

          {/* Title parsing regex (manual mode with title-based source) */}
          {configMode === 'manual' && (groupNameSource === 'title' || groupNameSource.startsWith('smart')) && (
            <FormField
              label={getMessage('titleRegex')}
              required={true}
              error={titleParsingRegExError}
            >
              {(fieldId, errorId) => (
                <Box style={{ marginTop: '4px' }}>
                  <RegexCodeField
                    id={fieldId}
                    describedById={titleParsingRegExError ? errorId : undefined}
                    value={titleParsingRegEx}
                    onChange={onTitleParsingRegExChange}
                    name="titleParsingRegEx"
                    testId="title-regex-field"
                    placeholder="(.+)"
                    ariaLabel={getMessage('titleRegexEditorAriaLabel')}
                    hasError={Boolean(titleParsingRegExError)}
                  />
                </Box>
              )}
            </FormField>
          )}

          {/* URL extraction (manual mode with URL-based source) */}
          {showUrlSection && (
            <Flex direction="column" gap="3">
              <Flex direction="column">
                <Text size="2" weight="bold" asChild>
                  <Label.Root htmlFor={urlExtractionModeInputId}>
                    {getMessage('urlExtractionModeLabel')}
                  </Label.Root>
                </Text>
                <Select.Root
                  value={urlExtractionMode}
                  onValueChange={(v) => onUrlExtractionModeChange(v as UrlExtractionModeValue)}
                >
                  <Select.Trigger
                    id={urlExtractionModeInputId}
                    style={{ marginTop: '4px' }}
                  />
                  <Select.Content>
                    {urlExtractionModeOptions.map((option) => (
                      <Select.Item key={option.value} value={option.value}>
                        {getMessage(option.keyLabel)}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Flex>

              {urlExtractionMode === 'regex' ? (
                <FormField
                  label={getMessage('urlRegex')}
                  required={true}
                  error={urlParsingRegExError}
                >
                  {(fieldId, errorId) => (
                    <Box style={{ marginTop: '4px' }}>
                      <RegexCodeField
                        id={fieldId}
                        describedById={urlParsingRegExError ? errorId : undefined}
                        value={urlParsingRegEx}
                        onChange={onUrlParsingRegExChange}
                        name="urlParsingRegEx"
                        testId="url-regex-field"
                        placeholder="(.+)"
                        ariaLabel={getMessage('urlRegexEditorAriaLabel')}
                        hasError={Boolean(urlParsingRegExError)}
                      />
                    </Box>
                  )}
                </FormField>
              ) : (
                <FormField
                  label={getMessage('urlQueryParamNameLabel')}
                  required={true}
                  error={urlQueryParamNameError}
                >
                  {(fieldId) => (
                    <Flex direction="column" gap="1" style={{ marginTop: '4px' }}>
                      <TextField.Root
                        id={fieldId}
                        value={urlQueryParamName}
                        onChange={(e) => onUrlQueryParamNameChange(e.target.value)}
                        name="urlQueryParamName"
                        placeholder={getMessage('urlQueryParamNamePlaceholder')}
                        maxLength={64}
                      />
                      <Text size="1" color="gray">{getMessage('urlQueryParamNameHelper')}</Text>
                    </Flex>
                  )}
                </FormField>
              )}
            </Flex>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}
