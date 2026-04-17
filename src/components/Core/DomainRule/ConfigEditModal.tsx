import { Button, Flex, ScrollArea } from '@radix-ui/themes';
import { useState, useCallback, useEffect, useMemo } from 'react';
import type { FieldError } from 'react-hook-form';
import { getMessage } from '@/utils/i18n';
import { DomainRulesTheme } from '@/components/Form/themes';
import { DialogShell } from '@/components/UI/DialogShell';
import { type GroupNameSourceValue } from '@/schemas/enums';
import { createRegexValidator } from '@/schemas/common';
import type { PresetCategory } from '@/utils/presetUtils';
import { getPresetById } from '@/utils/presetUtils';
import { logger } from '@/utils/logger';
import { DomainRuleConfigForm } from './DomainRuleConfigForm';

const regexValidator = createRegexValidator(true);

function validateRegex(value: string): FieldError | undefined {
  if (regexValidator.safeParse(value).success) return undefined;
  return { type: 'pattern', message: getMessage('errorInvalidRegex') };
}

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

  const titleFieldVisible =
    configMode === 'manual' && (groupNameSource === 'title' || groupNameSource.startsWith('smart'));
  const urlFieldVisible =
    configMode === 'manual' && (groupNameSource === 'url' || groupNameSource.startsWith('smart'));

  const titleRegexError = useMemo(
    () => (titleFieldVisible ? validateRegex(titleParsingRegEx) : undefined),
    [titleFieldVisible, titleParsingRegEx],
  );
  const urlRegexError = useMemo(
    () => (urlFieldVisible ? validateRegex(urlParsingRegEx) : undefined),
    [urlFieldVisible, urlParsingRegEx],
  );

  const hasRegexError = Boolean(titleRegexError || urlRegexError);

  const handleApply = () => {
    if (hasRegexError) return;
    onApply({ configMode, presetId, groupNameSource, titleParsingRegEx, urlParsingRegEx });
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <DomainRulesTheme>
      <DialogShell
        open={isOpen}
        onOpenChange={handleOpenChange}
        title={getMessage('editConfigTitle')}
        description={getMessage('editConfigTitle')}
        hideDescription
        maxWidth={480}
        showHeaderSeparator={false}
      >
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
              titleParsingRegExError={titleRegexError}
              urlParsingRegEx={urlParsingRegEx}
              onUrlParsingRegExChange={setUrlParsingRegEx}
              urlParsingRegExError={urlRegexError}
            />
          </Flex>
        </ScrollArea>

        <Flex gap="3" justify="end" mt="4">
          <Button variant="soft" color="gray" onClick={onClose}>
            {getMessage('cancel')}
          </Button>
          <Button onClick={handleApply} disabled={hasRegexError}>
            {getMessage('apply')}
          </Button>
        </Flex>
      </DialogShell>
    </DomainRulesTheme>
  );
}
