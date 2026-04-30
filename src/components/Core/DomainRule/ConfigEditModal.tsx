import { Button, Flex } from '@radix-ui/themes';
import { useState, useCallback, useEffect, useMemo } from 'react';
import type { FieldError } from 'react-hook-form';
import { getMessage } from '@/utils/i18n';
import { DialogShell } from '@/components/UI/DialogShell';
import { type GroupNameSourceValue, type UrlExtractionModeValue } from '@/schemas/enums';
import { createRegexValidator } from '@/schemas/common';
import type { PresetCategory } from '@/utils/presetUtils';
import { getPresetById } from '@/utils/presetUtils';
import { logger } from '@/utils/logger';
import { DomainRuleConfigForm } from './DomainRuleConfigForm';
import type { ConfigMode } from './ConfigModeSelector';

const regexValidator = createRegexValidator(true);
const QUERY_PARAM_NAME_PATTERN = /^[A-Za-z0-9_\-.]+$/;

function validateRegex(value: string): FieldError | undefined {
  if (regexValidator.safeParse(value).success) return undefined;
  return { type: 'pattern', message: getMessage('errorInvalidRegex') };
}

function validateQueryParamName(value: string): FieldError | undefined {
  if (!value || value.trim() === '') {
    return { type: 'required', message: getMessage('errorQueryParamNameRequired') };
  }
  if (value.length > 64 || !QUERY_PARAM_NAME_PATTERN.test(value)) {
    return { type: 'pattern', message: getMessage('errorInvalidQueryParamName') };
  }
  return undefined;
}

export interface ConfigEditValues {
  configMode: ConfigMode;
  presetId: string | null;
  groupNameSource: GroupNameSourceValue;
  titleParsingRegEx: string;
  urlParsingRegEx: string;
  urlExtractionMode: UrlExtractionModeValue;
  urlQueryParamName: string;
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
  const [configMode, setConfigMode] = useState<ConfigMode>(initial.configMode);
  const [presetId, setPresetId] = useState<string | null>(initial.presetId);
  const [groupNameSource, setGroupNameSource] = useState<GroupNameSourceValue>(initial.groupNameSource);
  const [titleParsingRegEx, setTitleParsingRegEx] = useState(initial.titleParsingRegEx);
  const [urlParsingRegEx, setUrlParsingRegEx] = useState(initial.urlParsingRegEx);
  const [urlExtractionMode, setUrlExtractionMode] = useState<UrlExtractionModeValue>(initial.urlExtractionMode);
  const [urlQueryParamName, setUrlQueryParamName] = useState(initial.urlQueryParamName);

  // Reset to initial values whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setConfigMode(initial.configMode);
      setPresetId(initial.presetId);
      setGroupNameSource(initial.groupNameSource);
      setTitleParsingRegEx(initial.titleParsingRegEx);
      setUrlParsingRegEx(initial.urlParsingRegEx);
      setUrlExtractionMode(initial.urlExtractionMode);
      setUrlQueryParamName(initial.urlQueryParamName);
    }
  }, [isOpen, initial]);

  const handleConfigModeChange = useCallback((newMode: ConfigMode) => {
    setConfigMode(newMode);
    // Clear presetId when leaving preset mode: otherwise inferConfigMode silently
    // re-classifies the rule as 'preset' on next open, undoing the user's mode change
    // (presetId would also be persisted alongside a non-preset configMode — corrupt state).
    if (newMode !== 'preset') {
      setPresetId(null);
    }
    // Ask mode persists groupNameSource as 'manual' — matches RuleWizardModal convention.
    if (newMode === 'ask') {
      setGroupNameSource('manual');
    }
  }, []);

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
        if (preset.urlExtractionMode) setUrlExtractionMode(preset.urlExtractionMode);
        if (preset.urlQueryParamName) setUrlQueryParamName(preset.urlQueryParamName);
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
    () => (urlFieldVisible && urlExtractionMode === 'regex' ? validateRegex(urlParsingRegEx) : undefined),
    [urlFieldVisible, urlExtractionMode, urlParsingRegEx],
  );
  const queryParamNameError = useMemo(
    () => (urlFieldVisible && urlExtractionMode === 'query_param' ? validateQueryParamName(urlQueryParamName) : undefined),
    [urlFieldVisible, urlExtractionMode, urlQueryParamName],
  );

  const hasError = Boolean(titleRegexError || urlRegexError || queryParamNameError);

  const handleApply = () => {
    if (hasError) return;
    onApply({
      configMode,
      presetId,
      groupNameSource,
      titleParsingRegEx,
      urlParsingRegEx,
      urlExtractionMode,
      urlQueryParamName,
    });
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <DialogShell
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={getMessage('editConfigTitle')}
      description={getMessage('editConfigTitle')}
      hideDescription
      maxWidth={820}
      showHeaderSeparator={false}
      contentStyle={{
        display: 'flex',
        flexDirection: 'column',
        height: '80vh',
        overflow: 'hidden',
      }}
    >
      <Flex
        direction="column"
        gap="4"
        mt="4"
        pr="3"
        style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
      >
        <DomainRuleConfigForm
          idPrefix="edit"
          configMode={configMode}
          onConfigModeChange={handleConfigModeChange}
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
          urlExtractionMode={urlExtractionMode}
          onUrlExtractionModeChange={setUrlExtractionMode}
          urlQueryParamName={urlQueryParamName}
          onUrlQueryParamNameChange={setUrlQueryParamName}
          urlQueryParamNameError={queryParamNameError}
        />
      </Flex>

      <Flex gap="3" justify="end" mt="4" style={{ flexShrink: 0 }}>
        <Button variant="soft" color="gray" onClick={onClose}>
          {getMessage('cancel')}
        </Button>
        <Button onClick={handleApply} disabled={hasError}>
          {getMessage('apply')}
        </Button>
      </Flex>
    </DialogShell>
  );
}
