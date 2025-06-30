import { Dialog, Button, Flex, Text, TextField, Switch, Select, Box, Separator, RadioGroup, Grid } from '@radix-ui/themes';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { DomainRulesTheme, RegexPresetsTheme, LogicalGroupsTheme } from '../themes';
import { DomainRulesCallouts, RegexPresetsCallouts } from '../themed-callouts';
import { generateUUID, getRadixColor } from '../../utils/utils';
import { createDomainRuleSchemaWithUniqueness, type DomainRule } from '../../schemas/domainRule';
import { groupNameSourceOptions, deduplicationMatchModeOptions } from '../../schemas/enums';
import { getMessage } from '../../utils/i18n';
import type { SyncSettings } from '../../types/syncSettings';
import { FieldLabel, FormField, RadioGroupField } from '../FormFields';

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
  
  
  const defaultValues: Partial<DomainRule> = domainRule ? {
    id: domainRule.id,
    domainFilter: domainRule.domainFilter,
    label: domainRule.label,
    titleParsingRegEx: domainRule.titleParsingRegEx,
    urlParsingRegEx: domainRule.urlParsingRegEx,
    groupNameSource: domainRule.groupNameSource,
    deduplicationMatchMode: domainRule.deduplicationMatchMode,
    groupId: domainRule.groupId,
    deduplicationEnabled: domainRule.deduplicationEnabled,
    presetId: domainRule.presetId
  } : {
    id: generateUUID(),
    domainFilter: '',
    label: '',
    titleParsingRegEx: '',
    urlParsingRegEx: '',
    groupNameSource: 'manual',
    deduplicationMatchMode: 'exact',
    groupId: null,
    deduplicationEnabled: true,
    presetId: null
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset
  } = useForm<DomainRule>({
    resolver: zodResolver(createDomainRuleSchemaWithUniqueness(syncSettings.domainRules, domainRule?.id)),
    defaultValues,
    mode: 'onChange'
  });

  const groupNameSource = watch('groupNameSource');
  const presetId = watch('presetId');
  const groupId = watch('groupId');
  const deduplicationEnabled = watch('deduplicationEnabled');

  // Trouver le groupe sélectionné pour appliquer sa couleur
  const selectedGroup = syncSettings.logicalGroups.find(group => group.id === groupId);
  const triggerColor = selectedGroup ? `var(--${getRadixColor(selectedGroup.color)}-11)` : undefined;

  const handleFormSubmit = (data: DomainRule) => {
    onSubmit(data);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const title = isEditing ? getMessage('editRule') : getMessage('createRule');

  return (
    <DomainRulesTheme>
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Content>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Description>
          {isEditing 
            ? getMessage('editRuleDescription') 
            : getMessage('createRuleDescription')
          }
        </Dialog.Description>

        {/* Info callout when no logical groups are defined */}
        {syncSettings.logicalGroups.length === 0 && (
          <DomainRulesCallouts.Info style={{ marginTop: '16px' }}>
            {getMessage('noLogicalGroupsDefined')}
          </DomainRulesCallouts.Info>
        )}

        {/* Info callout when no regex presets are defined */}
        {syncSettings.regexPresets.length === 0 && (
          <RegexPresetsCallouts.Info style={{ marginTop: '16px' }}>
            {getMessage('noRegexPresetsDefined')}
          </RegexPresetsCallouts.Info>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Flex direction="column" gap="4" mt="4">
            
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

            {/* Group Name Source and Preset Selection */}
            <Grid columns="2" gap="4">
              {/* Group Name Source */}
              <RadioGroupField
                label={getMessage('groupNameSource')}
                name="groupNameSource"
                options={groupNameSourceOptions}
                control={control}
              />

              {/* Preset Selection - only show if presets exist and source is title/url */}
              {(groupNameSource === 'title' || groupNameSource === 'url') && syncSettings.regexPresets.length > 0 ? (
                <RegexPresetsTheme>
                <Flex direction="column">
                  <Text as="label" size="2" weight="bold">
                    {getMessage('presetLabel')}
                  </Text>
                  <Controller
                    name="presetId"
                    control={control}
                    render={({ field }) => (
                      <Select.Root
                        value={field.value === null ? 'null' : field.value} 
                        onValueChange={(value) => field.onChange(value === 'null' ? null : value)}
                      >
                        <Select.Trigger variant="soft" placeholder={getMessage('noPreset')} style={{ marginTop: '4px' }} />
                        <Select.Content position="popper" side="bottom">
                          <Select.Item value="null">
                            {getMessage('noPreset')}
                          </Select.Item>
                          {syncSettings.regexPresets.map((preset) => (
                            <Select.Item key={preset.id} value={preset.id}>
                              {preset.name}
                            </Select.Item>
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

            {/* Title Parsing Regex */}
            {presetId === null && groupNameSource === 'title' && (
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

            {/* URL Parsing Regex */}
            {presetId === null && groupNameSource === 'url' && (
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

            {/* Logical Group - only show if groups exist */}
            {syncSettings.logicalGroups.length > 0 && (
              <>
                <Separator style={{ width: '100%' }} />
                <LogicalGroupsTheme>
                <Flex direction="column">
                  <Text as="label" size="2" weight="bold">
                    {getMessage('logicalGroup')}
                  </Text>
                  <Controller
                    name="groupId"
                    control={control}
                    render={({ field }) => (
                      <Select.Root 
                        value={field.value === null ? 'null' : field.value} 
                        onValueChange={(value) => field.onChange(value === 'null' ? null : value)}
                      >
                        <Select.Trigger 
                          variant='soft'
                          placeholder={getMessage('noGroup')} 
                          style={{ 
                            marginTop: '4px',
                            color: triggerColor 
                          }} 
                        />
                        <Select.Content position="popper" side="bottom">
                          <Select.Item value="null">
                            {getMessage('noGroup')}
                          </Select.Item>
                          {syncSettings.logicalGroups.map((group) => (
                            <Select.Item key={group.id} value={group.id} style={{ color: `var(--${getRadixColor(group.color)}-11)` }}>
                              {group.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    )}
                  />
                </Flex>
                </LogicalGroupsTheme>
              </>
            )}

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