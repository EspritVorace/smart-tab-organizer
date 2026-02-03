import { Dialog, Button, Flex, Text, TextField, Switch, Select, Box, Separator, Grid, ScrollArea } from '@radix-ui/themes';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { DomainRulesTheme, RegexPresetsTheme } from '../../Form/themes';
import { RegexPresetsCallouts } from '../../Form/themed-callouts';
import { generateUUID, getRadixColor } from '../../../utils/utils';
import { createDomainRuleSchemaWithUniqueness, type DomainRule } from '../../../schemas/domainRule';
import { groupNameSourceOptions, deduplicationMatchModeOptions, colorOptions } from '../../../schemas/enums';
import { getMessage } from '../../../utils/i18n';
import type { SyncSettings } from '../../../types/syncSettings';
import { FieldLabel, FormField, RadioGroupField } from '../../Form/FormFields';
import { getPresetById, loadPresets, type Preset } from '../../../utils/presetUtils';

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
  const [presetCategories, setPresetCategories] = useState<any[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  
  // Local state for config mode - calculated only when domainRule changes
  const [configMode, setConfigMode] = useState<'preset' | 'ask' | 'manual'>(() => {
    if (!domainRule) return 'ask';
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
      deduplicationEnabled: rule.deduplicationEnabled,
      presetId: rule.presetId
    } : {
      id: generateUUID(),
      domainFilter: '',
      label: '',
      titleParsingRegEx: '',
      urlParsingRegEx: '',
      groupNameSource: 'manual',
      deduplicationMatchMode: 'exact',
      color: 'grey',
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

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
    setValue
  } = useForm<DomainRule>({
    resolver: zodResolver(createDomainRuleSchemaWithUniqueness(syncSettings.domainRules, domainRule?.id)),
    defaultValues,
    mode: 'onChange'
  });

  const groupNameSource = watch('groupNameSource');
  const color = watch('color');
  const deduplicationEnabled = watch('deduplicationEnabled');

  // Réinitialiser le formulaire et le configMode quand domainRule change ET que le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      reset(getDefaultValues(domainRule));
      // Update configMode based on the new domainRule
      if (!domainRule) {
        setConfigMode('ask');
      } else if (domainRule.presetId) {
        setConfigMode('preset');
      } else if (domainRule.groupNameSource === 'manual') {
        setConfigMode('ask');
      } else {
        setConfigMode('manual');
      }
    }
  }, [domainRule, isOpen, reset]);

  // Gérer la sélection d'un preset
  const handlePresetChange = useCallback(async (selectedPresetId: string) => {
    if (selectedPresetId === 'null') {
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
    }
  }, [setValue]);

  // Gérer le changement de mode de configuration
  const handleConfigModeChange = useCallback((newMode: 'preset' | 'ask' | 'manual') => {
    setConfigMode(newMode);
    if (newMode === 'ask') {
      setValue('groupNameSource', 'manual');
    }
    // Note: preset mode is handled by the preset selector itself
    // We don't clear presetId to preserve user selections when switching modes
  }, [setValue]);

  const handleFormSubmit = (data: DomainRule) => {
    onSubmit(data);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    setConfigMode('ask'); // Reset to default mode
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
      <Dialog.Content>
        <Dialog.Title>{title}</Dialog.Title>
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
              
              {/* Label */}
              <FormField 
                label={getMessage('labelLabel')} 
                required={true} 
                error={errors.label}
              >
                <Controller
                  name="label"
                  control={control}
                  render={({ field }) => (
                    <TextField.Root
                      {...field}
                      placeholder={getMessage('labelPlaceholder')}
                      style={{ marginTop: '4px' }}
                    />
                  )}
                />
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
              <Grid columns="2" gap="4">
                <Flex direction="column">
                  <Text as="label" size="2" weight="bold">
                    {getMessage('configurationMode')}
                  </Text>
                  <Flex direction="row" gap="4" wrap="wrap" style={{ marginTop: '4px' }}>
                    <Flex align="center" gap="2">
                      <input
                        type="radio"
                        name="configMode"
                        value="preset"
                        checked={configMode === 'preset'}
                        onChange={() => handleConfigModeChange('preset')}
                      />
                      <Text size="2">{getMessage('configModePreset')}</Text>
                    </Flex>
                    <Flex align="center" gap="2">
                      <input
                        type="radio"
                        name="configMode"
                        value="ask"
                        checked={configMode === 'ask'}
                        onChange={() => handleConfigModeChange('ask')}
                      />
                      <Text size="2">{getMessage('configModeAsk')}</Text>
                    </Flex>
                    <Flex align="center" gap="2">
                      <input
                        type="radio"
                        name="configMode"
                        value="manual"
                        checked={configMode === 'manual'}
                        onChange={() => handleConfigModeChange('manual')}
                      />
                      <Text size="2">{getMessage('configModeManual')}</Text>
                    </Flex>
                  </Flex>
                </Flex>

                {/* Preset Selection - only shown when preset mode is selected */}
                {configMode === 'preset' && presetCategories.length > 0 && !isLoadingPresets ? (
                  <RegexPresetsTheme>
                  <Flex direction="column">
                    <Text as="label" size="2" weight="bold">
                      {getMessage('presetRuleLabel')}
                    </Text>
                    <Controller
                      name="presetId"
                      control={control}
                      render={({ field }) => (
                        <Select.Root
                          value={field.value === null ? 'null' : field.value}
                          onValueChange={handlePresetChange}
                        >
                          <Select.Trigger
                            variant="soft"
                            placeholder={getMessage('selectPreset')}
                            style={{ marginTop: '4px' }}
                          />
                          <Select.Content>
                            <Select.Item value="null">
                              {getMessage('noPresetSelected')}
                            </Select.Item>
                            {presetCategories.map((category) => (
                              <Select.Group key={category.name}>
                                <Select.Label>{category.name}</Select.Label>
                                {category.presets.map((preset: Preset) => (
                                  <Select.Item key={preset.id} value={preset.id}>
                                    {preset.name}
                                  </Select.Item>
                                ))}
                              </Select.Group>
                            ))}
                          </Select.Content>
                        </Select.Root>
                      )}
                    />
                  </Flex>
                  </RegexPresetsTheme>
                ) : (
                  <Box />
                )}
              </Grid>

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
                            variant="soft"
                            placeholder={getMessage('selectGroupNameSource')}
                            style={{ marginTop: '4px' }}
                          />
                          <Select.Content>
                            {groupNameSourceOptions.map((option) => (
                              <Select.Item key={option.value} value={option.value}>
                                {getMessage(option.keyLabel)}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                      )}
                    />
                  </Flex>
                  <Box />
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

              {/* Color Selection */}
              <Separator style={{ width: '100%' }} />
              <Grid columns="2" gap="4">
                <Flex direction="column">
                  <Text as="label" size="2" weight="bold">
                    {getMessage('color')}
                  </Text>
                  <Controller
                    name="color"
                    control={control}
                    render={({ field }) => (
                      <Select.Root 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <Select.Trigger 
                          variant='soft'
                          placeholder={getMessage('selectColor')} 
                          style={{ 
                            marginTop: '4px',
                            color: `var(--${getRadixColor(color)}-11)` 
                          }} 
                        />
                        <Select.Content position="popper" side="bottom">
                          {colorOptions.map((colorOption) => (
                            <Select.Item key={colorOption.value} value={colorOption.value} style={{ color: `var(--${getRadixColor(colorOption.value)}-11)` }}>
                              {getMessage(colorOption.keyLabel)}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    )}
                  />
                </Flex>
                <Box />
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