import { Button, Dialog, Flex, ScrollArea } from '@radix-ui/themes';
import { Edit2, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getMessage } from '../../../utils/i18n';
import { DomainRulesTheme } from '../../Form/themes';
import { WizardStepper } from '../../UI/WizardStepper/WizardStepper';
import { WizardStep1Identity } from './WizardStep1Identity';
import { WizardStep2Config } from './WizardStep2Config';
import { WizardStep3Options } from './WizardStep3Options';
import { WizardStep4Summary } from './WizardStep4Summary';
import { EditSummaryView } from './EditSummaryView';
import { type ConfigEditValues } from './ConfigEditModal';
import { generateUUID } from '../../../utils/utils';
import { createDomainRuleSchemaWithUniqueness, type DomainRule } from '../../../schemas/domainRule';
import { groupNameSourceOptions, type GroupNameSourceValue } from '../../../schemas/enums';
import { getPresetById, loadPresets, type PresetCategory } from '../../../utils/presetUtils';
import type { SyncSettings } from '../../../types/syncSettings';
import { logger } from '../../../utils/logger';

interface RuleWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (domainRule: DomainRule) => void;
  domainRule?: DomainRule;
  syncSettings: SyncSettings;
}

const VALID_GROUP_NAME_SOURCES = groupNameSourceOptions.map(o => o.value) as GroupNameSourceValue[];

const getDefaultValues = (rule?: DomainRule): Partial<DomainRule> => {
  return rule ? {
    id: rule.id,
    domainFilter: rule.domainFilter,
    label: rule.label,
    titleParsingRegEx: rule.titleParsingRegEx,
    urlParsingRegEx: rule.urlParsingRegEx,
    groupNameSource: (VALID_GROUP_NAME_SOURCES.includes(rule.groupNameSource) ? rule.groupNameSource : 'title') as GroupNameSourceValue,
    deduplicationMatchMode: rule.deduplicationMatchMode,
    color: rule.color || undefined,
    categoryId: rule.categoryId ?? null,
    deduplicationEnabled: rule.deduplicationEnabled,
    presetId: rule.presetId,
  } : {
    id: generateUUID(),
    domainFilter: '',
    label: '',
    titleParsingRegEx: '',
    urlParsingRegEx: '',
    groupNameSource: 'title',
    deduplicationMatchMode: 'exact',
    categoryId: null,
    deduplicationEnabled: true,
    presetId: null,
  };
};

function inferConfigMode(rule?: DomainRule): 'preset' | 'ask' | 'manual' {
  if (!rule) return 'preset';
  if (rule.presetId) return 'preset';
  if (rule.groupNameSource === 'manual') return 'ask';
  return 'manual';
}

const STEP_LABELS_KEYS = [
  'wizardStepIdentity',
  'wizardStepConfig',
  'wizardStepOptions',
  'wizardStepSummary',
] as const;

export function RuleWizardModal({
  isOpen,
  onClose,
  onSubmit,
  domainRule,
  syncSettings,
}: RuleWizardModalProps) {
  const isEditing = !!domainRule;
  const [step, setStep] = useState(0);
  const [configMode, setConfigMode] = useState<'preset' | 'ask' | 'manual'>(() => inferConfigMode(domainRule));
  const [presetCategories, setPresetCategories] = useState<PresetCategory[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  const [presetName, setPresetName] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  // aria-live announcement
  const [stepAnnouncement, setStepAnnouncement] = useState('');

  // State preservation refs for mode switching
  const lastManualState = useRef<{ groupNameSource: GroupNameSourceValue; titleParsingRegEx: string; urlParsingRegEx: string }>({
    groupNameSource: 'title', titleParsingRegEx: '', urlParsingRegEx: '',
  });
  const lastPresetState = useRef<{ presetId: string | null; groupNameSource: GroupNameSourceValue; titleParsingRegEx: string; urlParsingRegEx: string }>({
    presetId: null, groupNameSource: 'title', titleParsingRegEx: '', urlParsingRegEx: '',
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
    getValues,
    trigger,
  } = useForm<DomainRule>({
    resolver: zodResolver(createDomainRuleSchemaWithUniqueness(syncSettings.domainRules, domainRule?.id)),
    defaultValues: getDefaultValues(domainRule),
    mode: 'onChange',
  });

  const groupNameSource = watch('groupNameSource');
  const deduplicationEnabled = watch('deduplicationEnabled');

  // Load presets when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setIsLoadingPresets(true);
    loadPresets()
      .then((file) => setPresetCategories(file.categories))
      .catch((e) => logger.debug('[RuleWizardModal] Error loading presets:', e))
      .finally(() => setIsLoadingPresets(false));
  }, [isOpen]);

  // Update preset name when presetId changes
  useEffect(() => {
    const presetId = getValues('presetId');
    if (!presetId) { setPresetName(null); return; }
    getPresetById(presetId)
      .then((p) => setPresetName(p?.name ?? null))
      .catch(() => setPresetName(null));
  }, [watch('presetId')]);

  // Reset form and wizard state when modal opens/rule changes
  useEffect(() => {
    if (!isOpen) return;
    reset(getDefaultValues(domainRule));
    setStep(0);
    setStepError(null);
    setStepAnnouncement('');
    const mode = inferConfigMode(domainRule);
    setConfigMode(mode);
    if (!domainRule) {
      lastManualState.current = { groupNameSource: 'title', titleParsingRegEx: '', urlParsingRegEx: '' };
      lastPresetState.current = { presetId: null, groupNameSource: 'title', titleParsingRegEx: '', urlParsingRegEx: '' };
    } else if (domainRule.presetId) {
      lastPresetState.current = {
        presetId: domainRule.presetId,
        groupNameSource: domainRule.groupNameSource,
        titleParsingRegEx: domainRule.titleParsingRegEx ?? '',
        urlParsingRegEx: domainRule.urlParsingRegEx ?? '',
      };
      lastManualState.current = {
        groupNameSource: domainRule.groupNameSource,
        titleParsingRegEx: domainRule.titleParsingRegEx ?? '',
        urlParsingRegEx: domainRule.urlParsingRegEx ?? '',
      };
    } else if (domainRule.groupNameSource === 'manual') {
      lastManualState.current = { groupNameSource: 'title', titleParsingRegEx: '', urlParsingRegEx: '' };
      lastPresetState.current = { presetId: null, groupNameSource: 'title', titleParsingRegEx: '', urlParsingRegEx: '' };
    } else {
      lastManualState.current = {
        groupNameSource: domainRule.groupNameSource as GroupNameSourceValue,
        titleParsingRegEx: domainRule.titleParsingRegEx ?? '',
        urlParsingRegEx: domainRule.urlParsingRegEx ?? '',
      };
      lastPresetState.current = { presetId: null, groupNameSource: 'title', titleParsingRegEx: '', urlParsingRegEx: '' };
    }
  }, [domainRule, isOpen, reset]);

  const handlePresetChange = useCallback(async (selectedPresetId: string) => {
    if (!selectedPresetId) { setValue('presetId', null); return; }
    const preset = await getPresetById(selectedPresetId);
    if (preset) {
      setValue('presetId', selectedPresetId);
      setValue('groupNameSource', preset.groupNameSource);
      if (preset.titleRegex) setValue('titleParsingRegEx', preset.titleRegex);
      if (preset.urlRegex) setValue('urlParsingRegEx', preset.urlRegex);
      setPresetName(preset.name);
      lastPresetState.current = {
        presetId: selectedPresetId,
        groupNameSource: preset.groupNameSource,
        titleParsingRegEx: preset.titleRegex ?? '',
        urlParsingRegEx: preset.urlRegex ?? '',
      };
      lastManualState.current = {
        groupNameSource: preset.groupNameSource,
        titleParsingRegEx: preset.titleRegex ?? '',
        urlParsingRegEx: preset.urlRegex ?? '',
      };
      trigger();
    }
  }, [setValue, trigger]);

  const handleConfigModeChange = useCallback((newMode: 'preset' | 'ask' | 'manual') => {
    const prevMode = configMode;
    if (prevMode === 'manual' && newMode === 'preset') {
      lastManualState.current = {
        groupNameSource: getValues('groupNameSource') as GroupNameSourceValue,
        titleParsingRegEx: getValues('titleParsingRegEx') ?? '',
        urlParsingRegEx: getValues('urlParsingRegEx') ?? '',
      };
      setValue('presetId', lastPresetState.current.presetId);
      setValue('groupNameSource', lastPresetState.current.groupNameSource);
      setValue('titleParsingRegEx', lastPresetState.current.titleParsingRegEx);
      setValue('urlParsingRegEx', lastPresetState.current.urlParsingRegEx);
    } else if (prevMode === 'preset' && newMode === 'manual') {
      lastPresetState.current = {
        presetId: getValues('presetId') ?? null,
        groupNameSource: getValues('groupNameSource') as GroupNameSourceValue,
        titleParsingRegEx: getValues('titleParsingRegEx') ?? '',
        urlParsingRegEx: getValues('urlParsingRegEx') ?? '',
      };
      setValue('presetId', null);
      setValue('groupNameSource', lastManualState.current.groupNameSource);
      setValue('titleParsingRegEx', lastManualState.current.titleParsingRegEx);
      setValue('urlParsingRegEx', lastManualState.current.urlParsingRegEx);
    } else if (newMode === 'ask') {
      if (prevMode === 'manual') {
        lastManualState.current = {
          groupNameSource: getValues('groupNameSource') as GroupNameSourceValue,
          titleParsingRegEx: getValues('titleParsingRegEx') ?? '',
          urlParsingRegEx: getValues('urlParsingRegEx') ?? '',
        };
      } else if (prevMode === 'preset') {
        lastPresetState.current = {
          presetId: getValues('presetId') ?? null,
          groupNameSource: getValues('groupNameSource') as GroupNameSourceValue,
          titleParsingRegEx: getValues('titleParsingRegEx') ?? '',
          urlParsingRegEx: getValues('urlParsingRegEx') ?? '',
        };
      }
      setValue('presetId', null);
      setValue('groupNameSource', 'manual');
    } else if (prevMode === 'ask' && newMode === 'preset') {
      setValue('presetId', lastPresetState.current.presetId);
      setValue('groupNameSource', lastPresetState.current.groupNameSource);
      setValue('titleParsingRegEx', lastPresetState.current.titleParsingRegEx);
      setValue('urlParsingRegEx', lastPresetState.current.urlParsingRegEx);
    } else if (prevMode === 'ask' && newMode === 'manual') {
      setValue('presetId', null);
      setValue('groupNameSource', lastManualState.current.groupNameSource);
      setValue('titleParsingRegEx', lastManualState.current.titleParsingRegEx);
      setValue('urlParsingRegEx', lastManualState.current.urlParsingRegEx);
    }
    setConfigMode(newMode);
    trigger();
  }, [configMode, getValues, setValue, trigger]);

  const announceStep = (newStep: number) => {
    const label = getMessage(STEP_LABELS_KEYS[newStep]);
    setStepAnnouncement(getMessage('wizardStepAnnouncement')
      .replace('{step}', String(newStep + 1))
      .replace('{label}', label));
  };

  const handleNext = async () => {
    setStepError(null);
    let fieldsToValidate: (keyof DomainRule)[] = [];
    if (step === 0) {
      fieldsToValidate = ['label', 'domainFilter'];
    } else if (step === 1) {
      if (configMode === 'preset') fieldsToValidate = ['presetId'];
      else if (configMode === 'manual') {
        const src = getValues('groupNameSource');
        if (src === 'title' || src.startsWith('smart')) fieldsToValidate.push('titleParsingRegEx');
        if (src === 'url' || src.startsWith('smart')) fieldsToValidate.push('urlParsingRegEx');
      }
    }
    const valid = fieldsToValidate.length === 0 || await trigger(fieldsToValidate);
    if (!valid) return;
    const newStep = step + 1;
    setStep(newStep);
    announceStep(newStep);
  };

  const handlePrev = () => {
    const newStep = step - 1;
    setStep(newStep);
    announceStep(newStep);
  };

  const handleEditStep = (targetStep: number) => {
    setStep(targetStep);
    announceStep(targetStep);
  };

  const handleApplyConfig = (values: ConfigEditValues) => {
    // Save old mode for state preservation
    const prevMode = configMode;
    if (prevMode === 'manual') {
      lastManualState.current = {
        groupNameSource: getValues('groupNameSource') as GroupNameSourceValue,
        titleParsingRegEx: getValues('titleParsingRegEx') ?? '',
        urlParsingRegEx: getValues('urlParsingRegEx') ?? '',
      };
    } else if (prevMode === 'preset') {
      lastPresetState.current = {
        presetId: getValues('presetId') ?? null,
        groupNameSource: getValues('groupNameSource') as GroupNameSourceValue,
        titleParsingRegEx: getValues('titleParsingRegEx') ?? '',
        urlParsingRegEx: getValues('urlParsingRegEx') ?? '',
      };
    }
    setConfigMode(values.configMode);
    setValue('presetId', values.presetId);
    setValue('groupNameSource', values.groupNameSource);
    setValue('titleParsingRegEx', values.titleParsingRegEx);
    setValue('urlParsingRegEx', values.urlParsingRegEx);
    if (values.configMode === 'ask') {
      setValue('groupNameSource', 'manual');
    }
    trigger();
    // Refresh preset name
    if (values.presetId) {
      getPresetById(values.presetId)
        .then((p) => setPresetName(p?.name ?? null))
        .catch(() => setPresetName(null));
    } else {
      setPresetName(null);
    }
  };

  const handleFormSubmit = (data: DomainRule) => {
    setStepError(null);
    onSubmit(data);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    setStep(0);
    setConfigMode('preset');
    setStepError(null);
    setStepAnnouncement('');
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) handleClose();
  };

  const title = isEditing ? getMessage('editRule') : getMessage('createRule');
  const stepLabels = STEP_LABELS_KEYS.map((k) => ({ label: getMessage(k) }));

  const currentConfigValues: ConfigEditValues = {
    configMode,
    presetId: getValues('presetId') ?? null,
    groupNameSource: groupNameSource as GroupNameSourceValue,
    titleParsingRegEx: getValues('titleParsingRegEx') ?? '',
    urlParsingRegEx: getValues('urlParsingRegEx') ?? '',
  };

  return (
    <DomainRulesTheme>
      <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
        <Dialog.Content
          style={{ maxWidth: 560 }}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            const input = (e.currentTarget as HTMLElement).querySelector<HTMLInputElement>('input[name="label"]');
            input?.focus();
          }}
        >
          <Dialog.Title>
            <Flex align="center" gap="2">
              {isEditing ? <Edit2 size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
              {title}
            </Flex>
          </Dialog.Title>
          <Dialog.Description style={{ display: 'none' }}>
            {isEditing ? getMessage('editRuleDescription') : getMessage('createRuleDescription')}
          </Dialog.Description>

          {/* aria-live region for step announcements */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
          >
            {stepAnnouncement}
          </div>

          {/* Wizard stepper (creation only) */}
          {!isEditing && (
            <WizardStepper
              steps={stepLabels}
              currentStep={step}
              disableFutureNavigation={true}
            />
          )}

          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: '55vh' }}>
              <Flex direction="column" gap="4" mt="2" pr="3">
                {isEditing ? (
                  /* ── Edit mode ── */
                  <EditSummaryView
                    control={control}
                    errors={errors}
                    configMode={configMode}
                    onApplyConfig={handleApplyConfig}
                    presetCategories={presetCategories}
                    isLoadingPresets={isLoadingPresets}
                    presetName={presetName}
                    groupNameSource={groupNameSource as GroupNameSourceValue}
                    deduplicationEnabled={deduplicationEnabled}
                    currentConfigValues={currentConfigValues}
                  />
                ) : (
                  /* ── Creation wizard steps ── */
                  <>
                    {step === 0 && (
                      <WizardStep1Identity control={control} errors={errors} />
                    )}
                    {step === 1 && (
                      <WizardStep2Config
                        control={control}
                        errors={errors}
                        configMode={configMode}
                        onConfigModeChange={handleConfigModeChange}
                        presetCategories={presetCategories}
                        isLoadingPresets={isLoadingPresets}
                        handlePresetChange={handlePresetChange}
                        groupNameSource={groupNameSource as GroupNameSourceValue}
                      />
                    )}
                    {step === 2 && (
                      <WizardStep3Options control={control} deduplicationEnabled={deduplicationEnabled} />
                    )}
                    {step === 3 && (
                      <WizardStep4Summary
                        values={getValues() as DomainRule}
                        configMode={configMode}
                        presetName={presetName}
                        onEditStep={handleEditStep}
                      />
                    )}
                  </>
                )}
              </Flex>
            </ScrollArea>

            {/* Step error */}
            {stepError && (
              <Flex mt="2">
                <span style={{ color: 'var(--red-11)', fontSize: 13 }}>{stepError}</span>
              </Flex>
            )}

            {/* Footer buttons */}
            <Flex gap="3" justify="end" mt="4">
              {isEditing ? (
                <>
                  <Dialog.Close>
                    <Button variant="soft" color="gray" type="button">{getMessage('cancel')}</Button>
                  </Dialog.Close>
                  <Button type="submit">{getMessage('save')}</Button>
                </>
              ) : (
                <>
                  {step === 0 && (
                    <Dialog.Close>
                      <Button variant="soft" color="gray" type="button">{getMessage('cancel')}</Button>
                    </Dialog.Close>
                  )}
                  {step > 0 && (
                    <Button variant="soft" color="gray" type="button" onClick={handlePrev}>
                      {getMessage('previous')}
                    </Button>
                  )}
                  {step < 3 && (
                    <Button type="button" onClick={handleNext}>{getMessage('next')}</Button>
                  )}
                  {step === 3 && (
                    <Button type="submit">{getMessage('create')}</Button>
                  )}
                </>
              )}
            </Flex>
          </form>

          {/* Close (X) button */}
          <Dialog.Close>
            <Button
              variant="ghost"
              size="1"
              aria-label={getMessage('cancel')}
              style={{ position: 'absolute', top: '16px', right: '16px' }}
            >
              <X size={16} aria-hidden="true" />
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>
    </DomainRulesTheme>
  );
}
