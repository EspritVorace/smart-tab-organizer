import { Box, Button, Dialog, Flex } from '@radix-ui/themes';
import { Edit2, Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getMessage } from '@/utils/i18n';
import { WizardModal } from '@/components/UI/WizardModal';
import { WizardStepper } from '@/components/UI/WizardStepper/WizardStepper';
import { AriaButton } from '@/components/UI/AriaButton/AriaButton';
import { WizardStep1Identity } from './WizardStep1Identity';
import { WizardStep2Config } from './WizardStep2Config';
import { WizardStep3Options } from './WizardStep3Options';
import { WizardStep4Summary } from './WizardStep4Summary';
import { ConfigEditModal, type ConfigEditValues } from './ConfigEditModal';
import { IdentityEditModal, type IdentityEditValues } from './IdentityEditModal';
import { OptionsEditModal, type OptionsEditValues } from './OptionsEditModal';
import type { ConfigMode } from './ConfigModeSelector';
import { generateUUID } from '@/utils/utils';
import { createDomainRuleSchemaWithUniqueness, type DomainRule } from '@/schemas/domainRule';
import { groupNameSourceOptions, type GroupNameSourceValue, type UrlExtractionModeValue } from '@/schemas/enums';
import { getPresetById, loadPresets, type PresetCategory } from '@/utils/presetUtils';
import type { AppSettings } from '@/types/syncSettings';
import type { ChromeGroupColor } from '@/types/tabTree';
import { logger } from '@/utils/logger';

interface RuleWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (domainRule: DomainRule) => void;
  domainRule?: DomainRule;
  syncSettings: AppSettings;
}

const VALID_GROUP_NAME_SOURCES = groupNameSourceOptions.map(o => o.value) as GroupNameSourceValue[];

interface ModeStateSnapshot {
  groupNameSource: GroupNameSourceValue;
  titleParsingRegEx: string;
  urlParsingRegEx: string;
  urlExtractionMode: UrlExtractionModeValue;
  urlQueryParamName: string;
}

interface PresetStateSnapshot extends ModeStateSnapshot {
  presetId: string | null;
}

const emptyModeState: ModeStateSnapshot = {
  groupNameSource: 'title',
  titleParsingRegEx: '',
  urlParsingRegEx: '',
  urlExtractionMode: 'regex',
  urlQueryParamName: '',
};

const emptyPresetState: PresetStateSnapshot = {
  presetId: null,
  ...emptyModeState,
};

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
    ignoredQueryParams: rule.ignoredQueryParams ?? [],
    presetId: rule.presetId,
    urlExtractionMode: rule.urlExtractionMode ?? 'regex',
    urlQueryParamName: rule.urlQueryParamName ?? '',
  } : {
    id: generateUUID(),
    domainFilter: '',
    label: '',
    titleParsingRegEx: '',
    urlParsingRegEx: '',
    groupNameSource: 'title',
    deduplicationMatchMode: 'exact',
    color: 'grey',
    categoryId: null,
    deduplicationEnabled: true,
    ignoredQueryParams: [],
    presetId: null,
    urlExtractionMode: 'regex',
    urlQueryParamName: '',
  };
};

function inferConfigMode(rule?: DomainRule): ConfigMode {
  if (!rule) return 'preset';
  if (rule.presetId) return 'preset';
  if (rule.groupNameSource === 'manual') return 'ask';
  return 'manual';
}

function getManualModeFieldsToValidate(
  groupNameSource: string,
  extractionMode: UrlExtractionModeValue,
): (keyof DomainRule)[] {
  const fields: (keyof DomainRule)[] = [];
  if (groupNameSource === 'title' || groupNameSource.startsWith('smart')) {
    fields.push('titleParsingRegEx');
  }
  if (groupNameSource === 'url' || groupNameSource.startsWith('smart')) {
    fields.push(extractionMode === 'query_param' ? 'urlQueryParamName' : 'urlParsingRegEx');
  }
  return fields;
}

const STEP_LABELS_KEYS = [
  'wizardStepIdentity',
  'wizardStepConfig',
  'wizardStepOptions',
  'wizardStepSummary',
] as const;

const STEP_DESCRIPTION_KEYS = [
  'createRuleStepIdentityDescription',
  'createRuleStepConfigDescription',
  'createRuleStepOptionsDescription',
  'createRuleStepSummaryDescription',
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
  const [configMode, setConfigMode] = useState<ConfigMode>(() => inferConfigMode(domainRule));
  const [presetCategories, setPresetCategories] = useState<PresetCategory[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  const [presetName, setPresetName] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  // Sub-dialog visibility (edit mode only).
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);

  // aria-live announcement
  const [stepAnnouncement, setStepAnnouncement] = useState('');

  // State preservation refs for mode switching
  const lastManualState = useRef<ModeStateSnapshot>({ ...emptyModeState });
  const lastPresetState = useRef<PresetStateSnapshot>({ ...emptyPresetState });

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
    resolver: zodResolver(
      createDomainRuleSchemaWithUniqueness(syncSettings.domainRules, domainRule?.id),
    ) as Resolver<DomainRule>,
    defaultValues: getDefaultValues(domainRule),
    mode: 'onChange',
  });

  const groupNameSource = watch('groupNameSource');
  const deduplicationEnabled = watch('deduplicationEnabled');
  const watchedPresetId = watch('presetId');
  // Reactive snapshot of the full rule, used to feed the edit-mode summary so
  // it refreshes after each sub-dialog Apply (getValues() is not reactive).
  const watchedValues = useWatch({ control }) as DomainRule;

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
    if (!watchedPresetId) { setPresetName(null); return; }
    getPresetById(watchedPresetId)
      .then((p) => setPresetName(p?.name ?? null))
      .catch(() => setPresetName(null));
  }, [watchedPresetId]);

  // Reset form and wizard state when modal opens/rule changes
  useEffect(() => {
    if (!isOpen) return;
    reset(getDefaultValues(domainRule));
    setStep(0);
    setStepError(null);
    setStepAnnouncement('');
    setIsIdentityModalOpen(false);
    setIsConfigModalOpen(false);
    setIsOptionsModalOpen(false);
    const mode = inferConfigMode(domainRule);
    setConfigMode(mode);
    if (!domainRule || domainRule.groupNameSource === 'manual') {
      lastManualState.current = { ...emptyModeState };
      lastPresetState.current = { ...emptyPresetState };
    } else if (domainRule.presetId) {
      const snapshot: ModeStateSnapshot = {
        groupNameSource: domainRule.groupNameSource,
        titleParsingRegEx: domainRule.titleParsingRegEx ?? '',
        urlParsingRegEx: domainRule.urlParsingRegEx ?? '',
        urlExtractionMode: domainRule.urlExtractionMode ?? 'regex',
        urlQueryParamName: domainRule.urlQueryParamName ?? '',
      };
      lastPresetState.current = { presetId: domainRule.presetId, ...snapshot };
      lastManualState.current = { ...snapshot };
    } else {
      lastManualState.current = {
        groupNameSource: domainRule.groupNameSource as GroupNameSourceValue,
        titleParsingRegEx: domainRule.titleParsingRegEx ?? '',
        urlParsingRegEx: domainRule.urlParsingRegEx ?? '',
        urlExtractionMode: domainRule.urlExtractionMode ?? 'regex',
        urlQueryParamName: domainRule.urlQueryParamName ?? '',
      };
      lastPresetState.current = { ...emptyPresetState };
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
      const presetExtractionMode = (preset.urlExtractionMode ?? 'regex') as UrlExtractionModeValue;
      setValue('urlExtractionMode', presetExtractionMode);
      if (preset.urlQueryParamName) setValue('urlQueryParamName', preset.urlQueryParamName);
      setPresetName(preset.name);
      const snapshot: ModeStateSnapshot = {
        groupNameSource: preset.groupNameSource,
        titleParsingRegEx: preset.titleRegex ?? '',
        urlParsingRegEx: preset.urlRegex ?? '',
        urlExtractionMode: presetExtractionMode,
        urlQueryParamName: preset.urlQueryParamName ?? '',
      };
      lastPresetState.current = { presetId: selectedPresetId, ...snapshot };
      lastManualState.current = { ...snapshot };
      trigger();
    }
  }, [setValue, trigger]);

  const readModeState = useCallback((): ModeStateSnapshot => ({
    groupNameSource: getValues('groupNameSource') as GroupNameSourceValue,
    titleParsingRegEx: getValues('titleParsingRegEx') ?? '',
    urlParsingRegEx: getValues('urlParsingRegEx') ?? '',
    urlExtractionMode: (getValues('urlExtractionMode') ?? 'regex') as UrlExtractionModeValue,
    urlQueryParamName: getValues('urlQueryParamName') ?? '',
  }), [getValues]);

  const captureSnapshot = readModeState;

  const applySnapshot = useCallback((snapshot: ModeStateSnapshot) => {
    setValue('groupNameSource', snapshot.groupNameSource);
    setValue('titleParsingRegEx', snapshot.titleParsingRegEx);
    setValue('urlParsingRegEx', snapshot.urlParsingRegEx);
    setValue('urlExtractionMode', snapshot.urlExtractionMode);
    setValue('urlQueryParamName', snapshot.urlQueryParamName);
  }, [setValue]);

  const saveCurrentModeState = useCallback((prevMode: ConfigMode) => {
    if (prevMode === 'manual') {
      lastManualState.current = captureSnapshot();
    } else if (prevMode === 'preset') {
      lastPresetState.current = {
        presetId: getValues('presetId') ?? null,
        ...captureSnapshot(),
      };
    }
  }, [captureSnapshot, getValues]);

  const handleConfigModeChange = useCallback((newMode: ConfigMode) => {
    const prevMode = configMode;
    if (prevMode === 'manual' && newMode === 'preset') {
      saveCurrentModeState(prevMode);
      setValue('presetId', lastPresetState.current.presetId);
      applySnapshot(lastPresetState.current);
    } else if (prevMode === 'preset' && newMode === 'manual') {
      saveCurrentModeState(prevMode);
      setValue('presetId', null);
      applySnapshot(lastManualState.current);
    } else if (newMode === 'ask') {
      saveCurrentModeState(prevMode);
      setValue('presetId', null);
      setValue('groupNameSource', 'manual');
    } else if (prevMode === 'ask' && newMode === 'preset') {
      setValue('presetId', lastPresetState.current.presetId);
      applySnapshot(lastPresetState.current);
    } else if (prevMode === 'ask' && newMode === 'manual') {
      setValue('presetId', null);
      applySnapshot(lastManualState.current);
    }
    setConfigMode(newMode);
    trigger();
  }, [configMode, saveCurrentModeState, setValue, applySnapshot, trigger]);

  const announceStep = (newStep: number) => {
    const label = getMessage(STEP_LABELS_KEYS[newStep]);
    setStepAnnouncement(getMessage('wizardStepAnnouncement')
      .replace('{step}', String(newStep + 1))
      .replace('{label}', label));
  };

  const computeFieldsToValidate = (): (keyof DomainRule)[] => {
    if (step === 0) return ['label', 'domainFilter'];
    if (step === 1) {
      if (configMode === 'preset') return ['presetId'];
      if (configMode === 'manual') {
        return getManualModeFieldsToValidate(
          getValues('groupNameSource'),
          (getValues('urlExtractionMode') ?? 'regex') as UrlExtractionModeValue,
        );
      }
      return [];
    }
    if (step === 2) {
      const dedupEnabled = getValues('deduplicationEnabled');
      const mode = getValues('deduplicationMatchMode');
      return dedupEnabled && mode === 'exact_ignore_params' ? ['ignoredQueryParams'] : [];
    }
    return [];
  };

  const isPresetSelectionMissing =
    step === 1 && configMode === 'preset' && !watchedPresetId;

  const handleNext = async () => {
    setStepError(null);
    if (isPresetSelectionMissing) {
      setStepError(getMessage('errorPresetRequired'));
      return;
    }
    const fieldsToValidate = computeFieldsToValidate();
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

  // In create mode, the summary's "Modify" button jumps back to the relevant step.
  // In edit mode, it opens the matching sub-dialog instead.
  const handleEditStep = (targetStep: number) => {
    if (isEditing) {
      if (targetStep === 0) setIsIdentityModalOpen(true);
      else if (targetStep === 1) setIsConfigModalOpen(true);
      else if (targetStep === 2) setIsOptionsModalOpen(true);
      return;
    }
    setStep(targetStep);
    announceStep(targetStep);
  };

  const handleApplyIdentity = (values: IdentityEditValues) => {
    setValue('label', values.label, { shouldValidate: true, shouldDirty: true });
    setValue('categoryId', values.categoryId, { shouldDirty: true });
    setValue('color', values.color, { shouldDirty: true });
    setValue('domainFilter', values.domainFilter, { shouldValidate: true, shouldDirty: true });
    trigger();
  };

  const handleApplyConfig = (values: ConfigEditValues) => {
    saveCurrentModeState(configMode);
    setConfigMode(values.configMode);
    setValue('presetId', values.presetId);
    setValue('groupNameSource', values.groupNameSource);
    setValue('titleParsingRegEx', values.titleParsingRegEx);
    setValue('urlParsingRegEx', values.urlParsingRegEx);
    setValue('urlExtractionMode', values.urlExtractionMode);
    setValue('urlQueryParamName', values.urlQueryParamName);
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

  const handleApplyOptions = (values: OptionsEditValues) => {
    setValue('deduplicationEnabled', values.deduplicationEnabled, { shouldDirty: true });
    setValue('deduplicationMatchMode', values.deduplicationMatchMode, { shouldDirty: true });
    setValue('ignoredQueryParams', values.ignoredQueryParams, { shouldValidate: true, shouldDirty: true });
    trigger();
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
    setIsIdentityModalOpen(false);
    setIsConfigModalOpen(false);
    setIsOptionsModalOpen(false);
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
    ...readModeState(),
  };

  const currentIdentityValues: IdentityEditValues = {
    label: watchedValues?.label ?? '',
    categoryId: watchedValues?.categoryId ?? null,
    color: (watchedValues?.color ?? 'grey') as ChromeGroupColor,
    domainFilter: watchedValues?.domainFilter ?? '',
  };

  const description = isEditing
    ? getMessage('editRuleDescription')
    : getMessage(STEP_DESCRIPTION_KEYS[step]);

  return (
    <WizardModal
      open={isOpen}
      onOpenChange={handleOpenChange}
      data-testid="wizard-rule"
      icon={isEditing ? Edit2 : Plus}
      title={title}
      description={description}
      maxWidth={820}
      fillHeight={!isEditing && step === 1}
      onOpenAutoFocus={(e) => {
        e.preventDefault();
        const input = (e.currentTarget as HTMLElement).querySelector<HTMLInputElement>('input[name="domainFilter"]');
        input?.focus();
      }}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} style={{ display: 'contents' }}>
        {/* aria-live region for step announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
        >
          {stepAnnouncement}
        </div>

        {!isEditing && (
          <WizardStepper
            data-testid="wizard-rule-stepper"
            steps={stepLabels}
            currentStep={step}
            disableFutureNavigation={true}
          />
        )}

        <WizardModal.Body fillHeight={!isEditing && step === 1}>
          <Flex
            direction="column"
            gap="4"
            style={
              !isEditing && step === 1
                ? { flex: 1, minHeight: 0, overflow: 'hidden' }
                : undefined
            }
          >
            {isEditing ? (
              <Box data-testid="wizard-rule-edit-summary">
                <WizardStep4Summary
                  values={watchedValues}
                  configMode={configMode}
                  presetName={presetName}
                  onEditStep={handleEditStep}
                />
              </Box>
            ) : (
              <>
                {step === 0 && (
                  <Box data-testid="wizard-rule-step-1">
                    <WizardStep1Identity control={control} errors={errors} setValue={setValue} />
                  </Box>
                )}
                {step === 1 && (
                  <Box
                    data-testid="wizard-rule-step-2"
                    style={{
                      flex: 1,
                      minHeight: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                    }}
                  >
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
                  </Box>
                )}
                {step === 2 && (
                  <Box data-testid="wizard-rule-step-3">
                    <WizardStep3Options control={control} deduplicationEnabled={deduplicationEnabled} errors={errors} />
                  </Box>
                )}
                {step === 3 && (
                  <Box data-testid="wizard-rule-step-4">
                    <WizardStep4Summary
                      values={getValues() as DomainRule}
                      configMode={configMode}
                      presetName={presetName}
                      onEditStep={handleEditStep}
                    />
                  </Box>
                )}
              </>
            )}
            {stepError && (
              <Flex>
                <span style={{ color: 'var(--red-11)', fontSize: 13 }}>{stepError}</span>
              </Flex>
            )}
          </Flex>
        </WizardModal.Body>

        <WizardModal.Footer>
          {isEditing ? (
            <>
              <Dialog.Close>
                <Button variant="soft" color="gray" highContrast type="button">{getMessage('cancel')}</Button>
              </Dialog.Close>
              <Button data-testid="wizard-rule-btn-save" type="submit">{getMessage('save')}</Button>
            </>
          ) : (
            <>
              {step === 0 && (
                <Dialog.Close>
                  <Button variant="soft" color="gray" highContrast type="button">{getMessage('cancel')}</Button>
                </Dialog.Close>
              )}
              {step > 0 && (
                <Button variant="soft" color="gray" highContrast type="button" onClick={handlePrev}>
                  {getMessage('previous')}
                </Button>
              )}
              {step < 3 && (
                <AriaButton
                  data-testid="wizard-rule-btn-next"
                  type="button"
                  onClick={handleNext}
                  ariaDisabled={isPresetSelectionMissing}
                  disabledReason={isPresetSelectionMissing ? getMessage('errorPresetRequired') : undefined}
                >
                  {getMessage('next')}
                </AriaButton>
              )}
              {step === 3 && (
                <Button data-testid="wizard-rule-btn-create" type="submit">{getMessage('create')}</Button>
              )}
            </>
          )}
        </WizardModal.Footer>
      </form>

      {isEditing && (
        <>
          <IdentityEditModal
            isOpen={isIdentityModalOpen}
            onClose={() => setIsIdentityModalOpen(false)}
            onApply={handleApplyIdentity}
            initial={currentIdentityValues}
            existingRules={syncSettings.domainRules}
            editingRuleId={domainRule?.id}
          />
          <ConfigEditModal
            isOpen={isConfigModalOpen}
            onClose={() => setIsConfigModalOpen(false)}
            onApply={handleApplyConfig}
            initial={currentConfigValues}
            presetCategories={presetCategories}
            isLoadingPresets={isLoadingPresets}
          />
          <OptionsEditModal
            isOpen={isOptionsModalOpen}
            onClose={() => setIsOptionsModalOpen(false)}
            onApply={handleApplyOptions}
            initial={watchedValues}
          />
        </>
      )}
    </WizardModal>
  );
}
