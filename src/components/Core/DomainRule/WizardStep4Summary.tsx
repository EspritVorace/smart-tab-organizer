import React from 'react';
import { Badge, Box, Button, Flex, Separator, Text } from '@radix-ui/themes';
import { Pencil } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { deduplicationMatchModeOptions, groupNameSourceOptions } from '@/schemas/enums';
import { getRuleCategory, getCategoryLabel } from '@/utils/categoriesStore';
import type { DomainRule } from '@/schemas/domainRule';

interface WizardStep4SummaryProps {
  values: DomainRule;
  configMode: 'preset' | 'ask' | 'manual';
  presetName: string | null;
  onEditStep: (step: number) => void;
}

function SummarySection({ title, onEdit, stepIndex, children }: {
  title: string;
  onEdit: (step: number) => void;
  stepIndex: number;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Flex justify="between" align="center" mb="2">
        <Text size="2" weight="bold" color="gray">{title}</Text>
        <Button
          variant="ghost"
          size="1"
          onClick={() => onEdit(stepIndex)}
          aria-label={`${getMessage('summaryModify')} — ${title}`}
        >
          <Pencil size={12} aria-hidden="true" />
          {getMessage('summaryModify')}
        </Button>
      </Flex>
      {children}
    </Box>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Flex gap="2" align="baseline">
      <Text size="2" color="gray" style={{ minWidth: 130, flexShrink: 0 }}>{label}</Text>
      <Text size="2">{value}</Text>
    </Flex>
  );
}

function buildConfigSummary(
  configMode: 'preset' | 'ask' | 'manual',
  presetName: string | null,
  values: DomainRule,
): string {
  if (configMode === 'preset') {
    return getMessage('configSummaryPreset').replace('{name}', presetName ?? '—');
  }
  if (configMode === 'ask') {
    return getMessage('configSummaryAsk');
  }
  // manual
  const sourceOption = groupNameSourceOptions.find(o => o.value === values.groupNameSource);
  const sourceName = sourceOption ? getMessage(sourceOption.keyLabel) : values.groupNameSource;
  return getMessage('configSummaryManual').replace('{source}', sourceName);
}

function buildOptionsSummary(values: DomainRule): string {
  if (!values.deduplicationEnabled) {
    return getMessage('optionsSummaryDedupDisabled');
  }
  const modeOption = deduplicationMatchModeOptions.find(o => o.value === values.deduplicationMatchMode);
  const modeName = modeOption ? getMessage(modeOption.keyLabel) : values.deduplicationMatchMode;
  return getMessage('optionsSummaryDedupEnabled').replace('{mode}', modeName);
}

export function WizardStep4Summary({ values, configMode, presetName, onEditStep }: WizardStep4SummaryProps) {
  const category = getRuleCategory(values.categoryId);

  return (
    <Flex direction="column" gap="4">
      {/* Identity section */}
      <SummarySection title={getMessage('wizardStepIdentity')} onEdit={onEditStep} stepIndex={0}>
        <Flex direction="column" gap="1">
          <Flex gap="2" align="baseline">
            <Text size="2" color="gray" style={{ minWidth: 130, flexShrink: 0 }}>{getMessage('labelLabel')}</Text>
            <Flex align="center" gap="2">
              {category && (
                <Badge color="gray" variant="soft" size="1">
                  {category.emoji} {getCategoryLabel(category)}
                </Badge>
              )}
              <Text size="2">{values.label}</Text>
            </Flex>
          </Flex>
          <SummaryRow label={getMessage('domainFilter')} value={values.domainFilter} />
        </Flex>
      </SummarySection>

      <Separator style={{ width: '100%' }} />

      {/* Config section */}
      <SummarySection title={getMessage('wizardStepConfig')} onEdit={onEditStep} stepIndex={1}>
        <Text size="2">{buildConfigSummary(configMode, presetName, values)}</Text>
      </SummarySection>

      <Separator style={{ width: '100%' }} />

      {/* Options section */}
      <SummarySection title={getMessage('wizardStepOptions')} onEdit={onEditStep} stepIndex={2}>
        <Flex direction="column" gap="1">
          <Text size="2">{buildOptionsSummary(values)}</Text>
          {values.deduplicationEnabled
            && values.deduplicationMatchMode === 'exact_ignore_params'
            && values.ignoredQueryParams.length > 0 && (
              <SummaryRow
                label={getMessage('ignoredQueryParamsLabel')}
                value={values.ignoredQueryParams.join(', ')}
              />
          )}
        </Flex>
      </SummarySection>
    </Flex>
  );
}
