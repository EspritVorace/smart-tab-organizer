import { Button, Callout, Dialog, Flex, Grid, HoverCard, ScrollArea, SegmentedControl, Select, Text, TextField, Box } from '@radix-ui/themes';
import { Info, X } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { getMessage } from '../../../utils/i18n';
import { DomainRulesTheme, RegexPresetsTheme } from '../../Form/themes';
import { RegexPresetsCallouts } from '../../Form/themed-callouts';
import { FormField, SearchableSelect } from '../../Form/FormFields';
import { groupNameSourceOptions, type GroupNameSourceValue } from '../../../schemas/enums';
import type { PresetCategory } from '../../../utils/presetUtils';
import { getPresetById } from '../../../utils/presetUtils';
import { logger } from '../../../utils/logger';

export interface ConfigEditValues {
  configMode: 'preset' | 'ask' | 'manual';
  presetId: string | null;
  groupNameSource: GroupNameSourceValue;
  titleParsingRegEx: string;
  urlParsingRegEx: string;
}

interface ConfigEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (values: ConfigEditValues) => void;
  initial: ConfigEditValues;
  presetCategories: PresetCategory[];
  isLoadingPresets: boolean;
}

function presetsToSearchableGroups(categories: PresetCategory[]) {
  return categories.map((cat) => ({
    label: cat.name,
    options: cat.presets.map((p) => ({ value: p.id, label: p.name })),
  }));
}

export function ConfigEditModal({
  isOpen,
  onClose,
  onApply,
  initial,
  presetCategories,
  isLoadingPresets,
}: ConfigEditModalProps) {
  const [configMode, setConfigMode] = useState<'preset' | 'ask' | 'manual'>(initial.configMode);
  const [presetId, setPresetId] = useState<string | null>(initial.presetId);
  const [groupNameSource, setGroupNameSource] = useState<GroupNameSourceValue>(initial.groupNameSource);
  const [titleParsingRegEx, setTitleParsingRegEx] = useState(initial.titleParsingRegEx);
  const [urlParsingRegEx, setUrlParsingRegEx] = useState(initial.urlParsingRegEx);

  // Reset to initial values whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setConfigMode(initial.configMode);
      setPresetId(initial.presetId);
      setGroupNameSource(initial.groupNameSource);
      setTitleParsingRegEx(initial.titleParsingRegEx);
      setUrlParsingRegEx(initial.urlParsingRegEx);
    }
  }, [isOpen, initial]);

  const handlePresetChange = useCallback(async (selectedPresetId: string) => {
    if (!selectedPresetId) {
      setPresetId(null);
      return;
    }
    try {
      const preset = await getPresetById(selectedPresetId);
      if (preset) {
        setPresetId(selectedPresetId);
        setGroupNameSource(preset.groupNameSource as GroupNameSourceValue);
        if (preset.titleRegex) setTitleParsingRegEx(preset.titleRegex);
        if (preset.urlRegex) setUrlParsingRegEx(preset.urlRegex);
      }
    } catch (error) {
      logger.debug('[ConfigEditModal] Error loading preset:', error);
    }
  }, []);

  const handleApply = () => {
    onApply({ configMode, presetId, groupNameSource, titleParsingRegEx, urlParsingRegEx });
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <DomainRulesTheme>
      <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
        <Dialog.Content style={{ maxWidth: 480 }}>
          <Dialog.Title>{getMessage('editConfigTitle')}</Dialog.Title>
          <Dialog.Description style={{ display: 'none' }}>
            {getMessage('editConfigTitle')}
          </Dialog.Description>

          <ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: '55vh' }}>
            <Flex direction="column" gap="4" mt="4" pr="3">
              {/* Loading presets */}
              {isLoadingPresets && (
                <RegexPresetsCallouts.Info>
                  {getMessage('loadingPresets')}
                </RegexPresetsCallouts.Info>
              )}

              {/* Config Mode SegmentedControl */}
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="bold">
                  {getMessage('configurationMode')}
                </Text>
                <SegmentedControl.Root
                  value={configMode}
                  onValueChange={(v) => setConfigMode(v as 'preset' | 'ask' | 'manual')}
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
                          <HoverCard.Content size="1" maxWidth="240px" side="top" sideOffset={4}
                            align={mode === 'manual' ? 'end' : 'center'}>
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
                      <Text as="label" htmlFor="edit-presetId" size="2" weight="bold">
                        {getMessage('presetRuleLabel')}
                      </Text>
                      <SearchableSelect
                        id="edit-presetId"
                        value={presetId ?? ''}
                        onValueChange={handlePresetChange}
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

              {/* Ask mode */}
              {configMode === 'ask' && (
                <Callout.Root size="1" color="gray" variant="surface">
                  <Callout.Icon><Info size={14} aria-hidden="true" /></Callout.Icon>
                  <Callout.Text>{getMessage('configModeAskHelp')}</Callout.Text>
                </Callout.Root>
              )}

              {/* Manual mode */}
              {configMode === 'manual' && (
                <Grid columns="2" gap="4">
                  <Flex direction="column">
                    <Text as="label" htmlFor="edit-groupNameSource" size="2" weight="bold">
                      {getMessage('groupNameSource')}
                    </Text>
                    <Select.Root value={groupNameSource} onValueChange={(v) => setGroupNameSource(v as GroupNameSourceValue)}>
                      <Select.Trigger
                        id="edit-groupNameSource"
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
                <FormField label={getMessage('titleRegex')} required={true}>
                  <TextField.Root
                    value={titleParsingRegEx}
                    onChange={(e) => setTitleParsingRegEx(e.target.value)}
                    name="titleParsingRegEx"
                    placeholder="(.+)"
                    style={{ marginTop: '4px' }}
                  />
                </FormField>
              )}

              {/* URL Parsing Regex */}
              {configMode === 'manual' && (groupNameSource === 'url' || groupNameSource.startsWith('smart')) && (
                <FormField label={getMessage('urlRegex')} required={true}>
                  <TextField.Root
                    value={urlParsingRegEx}
                    onChange={(e) => setUrlParsingRegEx(e.target.value)}
                    name="urlParsingRegEx"
                    placeholder="(.+)"
                    style={{ marginTop: '4px' }}
                  />
                </FormField>
              )}
            </Flex>
          </ScrollArea>

          <Flex gap="3" justify="end" mt="4">
            <Button variant="soft" color="gray" onClick={onClose}>
              {getMessage('cancel')}
            </Button>
            <Button onClick={handleApply}>
              {getMessage('apply')}
            </Button>
          </Flex>

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
