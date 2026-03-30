import * as Collapsible from '@radix-ui/react-collapsible';
import { Box, Button, Flex, IconButton, Separator, Text, TextField, Grid } from '@radix-ui/themes';
import { ChevronDown, ChevronRight, Pencil } from 'lucide-react';
import { useState } from 'react';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { getMessage } from '../../../utils/i18n';
import { CategoryPicker } from './CategoryPicker';
import { FormField } from '../../Form/FormFields';
import { ConfigEditModal, type ConfigEditValues } from './ConfigEditModal';
import { WizardStep3Options } from './WizardStep3Options';
import { getRuleCategory, groupNameSourceOptions, deduplicationMatchModeOptions } from '../../../schemas/enums';
import type { DomainRule } from '../../../schemas/domainRule';
import type { PresetCategory } from '../../../utils/presetUtils';
import type { GroupNameSourceValue } from '../../../schemas/enums';

interface EditSummaryViewProps {
  control: Control<DomainRule>;
  errors: FieldErrors<DomainRule>;
  configMode: 'preset' | 'ask' | 'manual';
  onApplyConfig: (values: ConfigEditValues) => void;
  presetCategories: PresetCategory[];
  isLoadingPresets: boolean;
  presetName: string | null;
  groupNameSource: GroupNameSourceValue;
  deduplicationEnabled: boolean;
  currentConfigValues: ConfigEditValues;
}

function buildConfigSummary(
  configMode: 'preset' | 'ask' | 'manual',
  presetName: string | null,
  groupNameSource: GroupNameSourceValue,
): string {
  if (configMode === 'preset') {
    return getMessage('configSummaryPreset').replace('{name}', presetName ?? '—');
  }
  if (configMode === 'ask') {
    return getMessage('configSummaryAsk');
  }
  const sourceOption = groupNameSourceOptions.find(o => o.value === groupNameSource);
  const sourceName = sourceOption ? getMessage(sourceOption.keyLabel) : groupNameSource;
  return getMessage('configSummaryManual').replace('{source}', sourceName);
}

function buildOptionsSummary(deduplicationEnabled: boolean, deduplicationMatchMode: string): string {
  if (!deduplicationEnabled) {
    return getMessage('optionsSummaryDedupDisabled');
  }
  const modeOption = deduplicationMatchModeOptions.find(o => o.value === deduplicationMatchMode);
  const modeName = modeOption ? getMessage(modeOption.keyLabel) : deduplicationMatchMode;
  return getMessage('optionsSummaryDedupEnabled').replace('{mode}', modeName);
}

export function EditSummaryView({
  control,
  errors,
  configMode,
  onApplyConfig,
  presetCategories,
  isLoadingPresets,
  presetName,
  groupNameSource,
  deduplicationEnabled,
  currentConfigValues,
}: EditSummaryViewProps) {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  return (
    <Flex direction="column" gap="4">
      {/* ── Zone 1 : Identité ── */}
      <Box>
        <Text size="2" weight="bold" color="gray" mb="2" as="p">
          {getMessage('wizardStepIdentity')}
        </Text>
        <Flex direction="column" gap="3">
          <FormField
            label={getMessage('labelLabel')}
            required={true}
            error={errors.label}
          >
            <Flex align="center" gap="2" style={{ marginTop: '4px' }}>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <CategoryPicker value={field.value as any} onChange={field.onChange} />
                )}
              />
              <Box style={{ flex: 1 }}>
                <Controller
                  name="label"
                  control={control}
                  render={({ field }) => (
                    <TextField.Root
                      {...field}
                      name="label"
                      placeholder={getMessage('labelPlaceholder')}
                    />
                  )}
                />
              </Box>
            </Flex>
          </FormField>

          <FormField
            label={getMessage('domainFilter')}
            required={true}
            error={errors.domainFilter}
          >
            <Controller
              name="domainFilter"
              control={control}
              render={({ field }) => (
                <TextField.Root
                  {...field}
                  name="domainFilter"
                  placeholder={getMessage('domainFilterPlaceholder')}
                  style={{ marginTop: '4px' }}
                />
              )}
            />
          </FormField>
        </Flex>
      </Box>

      <Separator style={{ width: '100%' }} />

      {/* ── Zone 2 : Configuration ── */}
      <Box>
        <Flex justify="between" align="center" mb="2">
          <Text size="2" weight="bold" color="gray">{getMessage('wizardStepConfig')}</Text>
          <IconButton
            type="button"
            variant="ghost"
            size="1"
            onClick={() => setIsConfigModalOpen(true)}
            title={getMessage('editConfigAriaLabel')}
            aria-label={getMessage('editConfigAriaLabel')}
          >
            <Pencil size={14} aria-hidden="true" />
          </IconButton>
        </Flex>
        <Text size="2">
          {buildConfigSummary(configMode, presetName, groupNameSource)}
        </Text>
      </Box>

      <Separator style={{ width: '100%' }} />

      {/* ── Zone 3 : Options (Collapsible) ── */}
      <Collapsible.Root open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
        <Collapsible.Trigger asChild>
          <Button type="button" variant="ghost" size="2" style={{ width: '100%', justifyContent: 'flex-start', '--button-ghost-padding-x': '0px' } as React.CSSProperties}>
            <Flex align="center" gap="2" style={{ width: '100%' }}>
              {isOptionsOpen
                ? <ChevronDown size={14} aria-hidden="true" />
                : <ChevronRight size={14} aria-hidden="true" />}
              <Flex direction="column" align="start" gap="1" style={{ flex: 1 }}>
                <Text size="2" weight="bold" color="gray">{getMessage('wizardStepOptions')}</Text>
                {!isOptionsOpen && (
                  <Controller
                    name="deduplicationMatchMode"
                    control={control}
                    render={({ field }) => (
                      <Text size="1" color="gray">
                        {buildOptionsSummary(deduplicationEnabled, field.value)}
                      </Text>
                    )}
                  />
                )}
              </Flex>
            </Flex>
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <Box pt="3">
            <WizardStep3Options control={control} deduplicationEnabled={deduplicationEnabled} />
          </Box>
        </Collapsible.Content>
      </Collapsible.Root>

      {/* Config edit secondary modal */}
      <ConfigEditModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onApply={onApplyConfig}
        initial={currentConfigValues}
        presetCategories={presetCategories}
        isLoadingPresets={isLoadingPresets}
      />
    </Flex>
  );
}
