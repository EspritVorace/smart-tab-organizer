import { Dialog, Button, Flex, Text, TextField, Switch, Select, Box, Separator, Grid, ScrollArea, SegmentedControl, Callout } from '@radix-ui/themes';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Edit2, Plus, Info } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { DomainRulesTheme, RegexPresetsTheme } from '../../Form/themes';
import { RegexPresetsCallouts } from '../../Form/themed-callouts';
import { generateUUID } from '../../../utils/utils';
import { createDomainRuleSchemaWithUniqueness, type DomainRule } from '../../../schemas/domainRule';
import { groupNameSourceOptions, deduplicationMatchModeOptions, type GroupNameSourceValue } from '../../../schemas/enums';
import { getMessage } from '../../../utils/i18n';
import { CategoryPicker } from './CategoryPicker';
import type { SyncSettings } from '../../../types/syncSettings';
import { FieldLabel, FormField, RadioGroupField, SearchableSelect } from '../../Form/FormFields';
import { getPresetById, loadPresets, type PresetCategory } from '../../../utils/presetUtils';
import { presetsToSearchableGroups } from '../../../utils/presetsToSearchableGroups';

interface DomainRuleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (domainRule: DomainRule) => void;
  domainRule?: DomainRule;
  syncSettings: SyncSettings;
}

export function DomainRuleFormModal({
  isOpen,
  onClose,
  onSubmit,
  domainRule,
  syncSettings
}: DomainRuleFormModalProps) {
  const isEditing = !!domainRule;
  const [presetCategories, setPresetCategories] = useState<PresetCategory[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  
  // Local state for config mode - calculated only when domainRule changes
  const [configMode, setConfigMode] = useState<'preset' | 'ask' | 'manual'>(() => {
    if (!domainRule) return 'preset';
    if (domainRule.presetId) return 'preset';
    if (domainRule.groupNameSource === 'manual') return 'ask';
    return 'manual';
  });
  
  // Helper function to get default values
  const getDefaultValues = (rule?: DomainRule): Partial<DomainRule> => {
    return rule ? {
      id: rule.id,
      domainFilter: rule.domainFilter,
      label: rule.label,
      titleParsingRegEx: rule.titleParsingRegEx,
      urlParsingRegEx: rule.urlParsingRegEx,
      groupNameSource: rule.groupNameSource,
      deduplicationMatchMode: rule.deduplicationMatchMode,
      color: rule.color,
      categoryId: rule.categoryId ?? null,
      deduplicationEnabled: rule.deduplicationEnabled,
      presetId: rule.presetId
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
      presetId: null
    };
  };

  // Charger les presets au montage du composant
  useEffect(() => {
    async function loadPresetsData() {
      setIsLoadingPresets(true);
      try {
        // Charger les catégories pour les groupes
        const presetsFile = await loadPresets();
        setPresetCategories(presetsFile.categories);
      } catch (error) {
        console.error('Error loading presets:', error);
      } finally {
        setIsLoadingPresets(false);
      }
    }
    
    if (isOpen) {
      loadPresetsData();
    }
  }, [isOpen]);
  
  const defaultValues = getDefaultValues(domainRule);

  const lastManualState = useRef<{
    groupNameSource: GroupNameSourceValue;
    titleParsingRegEx: string;
    urlParsingRegEx: string;
  }>({ groupNameSource: 'title', titleParsingRegEx: '', urlParsingRegEx: '' });

  const lastPresetState = useRef<{
    presetId: string | null;
    groupNameSource: GroupNameSourceValue;
    titleParsingRegEx: string;
    urlParsingRegEx: string;
  }>({ presetId: null, groupNameSource: 'title', titleParsingRegEx: '', urlParsingRegEx: '' });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
    setValue,
    getValues,
    trigger
  } = useForm<DomainRule>({
    resolver: zodResolver(createDomainRuleSchemaWithUniqueness(syncSettings.domainRules, domainRule?.id)),
    defaultValues,
    mode: 'onChange'
  });

  const groupNameSource = watch('groupNameSource');
  const deduplicationEnabled = watch('deduplicationEnabled');

  // Réinitialiser le formulaire et le configMode quand domainRule change ET que le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      reset(getDefaultValues(domainRule));
      // Update configMode based on the new domainRule
      if (!domainRule) {
        setConfigMode('preset');
        lastManualState.current = { groupNameSource: 'title', titleParsingRegEx: '', urlParsingRegEx: '' };
        lastPresetState.current = { presetId: null, groupNameSource: 'title', titleParsingRegEx: '', urlParsingRegEx: '' };
      } else if (domainRule.presetId) {
        setConfigMode('preset');
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
        setConfigMode('ask');
        lastManualState.current = { groupNameSource: 'title', titleParsingRegEx: '', urlParsingRegEx: '' };
        lastPresetState.current = { presetId: null, groupNameSource: 'title', titleParsingRegEx: '', urlParsingRegEx: '' };
      } else {
        setConfigMode('manual');
        lastManualState.current = {
          groupNameSource: domainRule.groupNameSource as GroupNameSourceValue,
          titleParsingRegEx: domainRule.titleParsingRegEx ?? '',
          urlParsingRegEx: domainRule.urlParsingRegEx ?? '',
        };
        lastPresetState.current = { presetId: null, groupNameSource: 'title', titleParsingRegEx: '', urlParsingRegEx: '' };
      }
    }
  }, [domainRule, isOpen, reset]);

  // Gérer la sélection d'un preset
  const handlePresetChange = useCallback(async (selectedPresetId: string) => {
    if (!selectedPresetId) {
      setValue('presetId', null);
      return;
    }

    const preset = await getPresetById(selectedPresetId);
    if (preset) {
      setValue('presetId', selectedPresetId);
      setValue('groupNameSource', preset.groupNameSource);
      if (preset.titleRegex) {
        setValue('titleParsingRegEx', preset.titleRegex);
      }
      if (preset.urlRegex) {
        setValue('urlParsingRegEx', preset.urlRegex);
      }
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

  // Gérer le changement de mode de configuration
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

  const handleFormSubmit = (data: DomainRule) => {
    onSubmit(data);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    setConfigMode('preset'); // Reset to default mode
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  const title = isEditing ? getMessage('editRule') : getMessage('createRule');

  return (
    <DomainRulesTheme>
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Content onOpenAutoFocus={(e) => {
        e.preventDefault();
        const input = (e.currentTarget as HTMLElement).querySelector<HTMLInputElement>('input[name="label"]');
        input?.focus();
      }}>
        <Dialog.Title>
          <Flex align="center" gap="2">
            {isEditing ? <Edit2 size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
            {title}
          </Flex>
        </Dialog.Title>
        <Dialog.Description>
          {isEditing 
            ? getMessage('editRuleDescription') 
            : getMessage('createRuleDescription')
          }
        </Dialog.Description>


        {/* Info callout when presets are loading */}
        {isLoadingPresets && (
          <RegexPresetsCallouts.Info style={{ marginTop: '16px' }}>
            {getMessage('loadingPresets')}
          </RegexPresetsCallouts.Info>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: '60vh' }}>
            <Flex direction="column" gap="4" mt="4" pr="3">
              
              {/* Label + Category */}
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
                          placeholder={getMessage('labelPlaceholder')}
                        />
                      )}
                    />
                  </Box>
                </Flex>
              </FormField>

              {/* Domain Filter */}
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
                      placeholder="example.com"
                      style={{ marginTop: '4px' }}
                    />
                  )}
                />
              </FormField>

              <Separator style={{ width: '100%' }} />

              {/* Configuration Mode Selection */}
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="bold">
                  {getMessage('configurationMode')}
                </Text>
                <SegmentedControl.Root
                  value={configMode}
                  onValueChange={(v) => handleConfigModeChange(v as 'preset' | 'ask' | 'manual')}
                  size="2"
                >
                  <SegmentedControl.Item value="preset">{getMessage('configModePreset')}</SegmentedControl.Item>
                  <SegmentedControl.Item value="ask">{getMessage('configModeAsk')}</SegmentedControl.Item>
                  <SegmentedControl.Item value="manual">{getMessage('configModeManual')}</SegmentedControl.Item>
                </SegmentedControl.Root>
                <Callout.Root size="1" color="gray" variant="surface">
                  <Callout.Icon><Info size={14} aria-hidden="true" /></Callout.Icon>
                  <Callout.Text>
                    {getMessage(({ preset: 'configModePresetHelp', ask: 'configModeAskHelp', manual: 'configModeManualHelp' } as const)[configMode])}
                  </Callout.Text>
                </Callout.Root>
              </Flex>

              {/* Preset Selection - only shown when preset mode is selected */}
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

              {configMode === 'manual' && (
                <Grid columns="2" gap="4">
                  {/* Group Name Source as Select */}
                  <Flex direction="column">
                    <Text as="label" size="2" weight="bold">
                      {getMessage('groupNameSource')}
                    </Text>
                    <Controller
                      name="groupNameSource"
                      control={control}
                      render={({ field }) => (
                        <Select.Root
                          value={field.value}
                          onValueChange={field.onChange}
                        >
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
                          smart_preset: 'groupNameSourceSmartPresetHelp', // legacy only
                          smart_label: 'groupNameSourceSmartLabelHelp',
                        } as const)[groupNameSource])}
                      </Callout.Text>
                    </Callout.Root>
                  </Flex>
                </Grid>
              )}

              {/* Title Parsing Regex - show in manual mode for title and smart modes */}
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
                        placeholder="(.+)"
                        style={{ marginTop: '4px' }}
                      />
                    )}
                  />
                </FormField>
              )}

              {/* URL Parsing Regex - show in manual mode for url and smart modes */}
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
                        placeholder="(.+)"
                        style={{ marginTop: '4px' }}
                      />
                    )}
                  />
                </FormField>
              )}

              <Separator style={{ width: '100%' }} />

              {/* Deduplication Settings */}
              <Grid columns="2" gap="4">
                {/* Enable Deduplication */}
                <Flex direction="column">
                  <FieldLabel>{getMessage('enableDeduplication')}</FieldLabel>
                  <Flex align="center" style={{ marginTop: '4px' }}>
                    <Controller
                      name="deduplicationEnabled"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </Flex>
                </Flex>

                {/* Deduplication Match Mode */}
                {deduplicationEnabled ? (
                  <RadioGroupField
                    label={getMessage('deduplicationMode')}
                    name="deduplicationMatchMode"
                    options={deduplicationMatchModeOptions}
                    control={control}
                  />
                ) : (
                  <Box />
                )}
              </Grid>

            </Flex>
          </ScrollArea>

          <Flex gap="3" justify="end" mt="4">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                {getMessage('cancel')}
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={!isValid}>
              {isEditing ? getMessage('save') : getMessage('create')}
            </Button>
          </Flex>
        </form>

        <Dialog.Close>
          <Button
            variant="ghost"
            size="1"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px'
            }}
          >
            <X size={16} />
          </Button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
    </DomainRulesTheme>
  );
}