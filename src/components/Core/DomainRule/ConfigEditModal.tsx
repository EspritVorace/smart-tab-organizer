import { Button, Dialog, Flex, ScrollArea } from '@radix-ui/themes';
import { X } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { getMessage } from '@/utils/i18n';
import { DomainRulesTheme } from '@/components/Form/themes';
import { type GroupNameSourceValue } from '@/schemas/enums';
import type { PresetCategory } from '@/utils/presetUtils';
import { getPresetById } from '@/utils/presetUtils';
import { logger } from '@/utils/logger';
import { DomainRuleConfigForm } from './DomainRuleConfigForm';

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
              <DomainRuleConfigForm
                idPrefix="edit"
                configMode={configMode}
                onConfigModeChange={setConfigMode}
                presetId={presetId}
                onPresetChange={handlePresetChange}
                presetCategories={presetCategories}
                isLoadingPresets={isLoadingPresets}
                groupNameSource={groupNameSource}
                onGroupNameSourceChange={setGroupNameSource}
                titleParsingRegEx={titleParsingRegEx}
                onTitleParsingRegExChange={setTitleParsingRegEx}
                urlParsingRegEx={urlParsingRegEx}
                onUrlParsingRegExChange={setUrlParsingRegEx}
              />
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
