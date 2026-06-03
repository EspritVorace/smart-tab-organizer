import { Flex } from '@radix-ui/themes';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { FieldError } from 'react-hook-form';
import { getMessage } from '@/utils/i18n';
import { type GroupNameSourceValue, type UrlExtractionModeValue } from '@/schemas/enums';
import { createRegexValidator } from '@/schemas/common';
import type { PresetCategory } from '@/utils/presetUtils';
import { getPresetById } from '@/utils/presetUtils';
import { logger } from '@/utils/logger';
import { DomainRuleConfigForm } from './DomainRuleConfigForm';
import type { ConfigMode } from './ConfigModeSelector';
import {
  type ConfigFields,
  type ConfigSnapshots,
  applyPresetSelection,
  enterModePatch,
  initSnapshots,
  saveModeSnapshot,
} from './configModeState';
import { EditModalShell } from './EditModalShell';

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
  fallbackLabel: string;
}

interface ConfigEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (values: ConfigEditValues) => void;
  initial: ConfigEditValues;
  presetCategories: PresetCategory[];
  isLoadingPresets: boolean;
}

function initialToFields(initial: ConfigEditValues): ConfigFields {
  return {
    presetId: initial.presetId,
    groupNameSource: initial.groupNameSource,
    titleParsingRegEx: initial.titleParsingRegEx,
    urlParsingRegEx: initial.urlParsingRegEx,
    urlExtractionMode: initial.urlExtractionMode,
    urlQueryParamName: initial.urlQueryParamName,
    fallbackLabel: initial.fallbackLabel,
  };
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
  const [fallbackLabel, setFallbackLabel] = useState(initial.fallbackLabel);

  // Per-mode internal state preserved across mode switches for the modal session.
  const snapshotsRef = useRef<ConfigSnapshots>(initSnapshots(initialToFields(initial), initial.configMode));

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
      setFallbackLabel(initial.fallbackLabel);
      snapshotsRef.current = initSnapshots(initialToFields(initial), initial.configMode);
    }
  }, [isOpen, initial]);

  const readFields = useCallback((): ConfigFields => ({
    presetId,
    groupNameSource,
    titleParsingRegEx,
    urlParsingRegEx,
    urlExtractionMode,
    urlQueryParamName,
    fallbackLabel,
  }), [presetId, groupNameSource, titleParsingRegEx, urlParsingRegEx, urlExtractionMode, urlQueryParamName, fallbackLabel]);

  const applyPatch = useCallback((patch: Partial<ConfigFields>) => {
    if (patch.presetId !== undefined) setPresetId(patch.presetId);
    if (patch.groupNameSource !== undefined) setGroupNameSource(patch.groupNameSource);
    if (patch.titleParsingRegEx !== undefined) setTitleParsingRegEx(patch.titleParsingRegEx);
    if (patch.urlParsingRegEx !== undefined) setUrlParsingRegEx(patch.urlParsingRegEx);
    if (patch.urlExtractionMode !== undefined) setUrlExtractionMode(patch.urlExtractionMode);
    if (patch.urlQueryParamName !== undefined) setUrlQueryParamName(patch.urlQueryParamName);
    if (patch.fallbackLabel !== undefined) setFallbackLabel(patch.fallbackLabel);
  }, []);

  const handleConfigModeChange = useCallback((newMode: ConfigMode) => {
    if (configMode !== newMode) {
      snapshotsRef.current = saveModeSnapshot(snapshotsRef.current, configMode, readFields());
    }
    applyPatch(enterModePatch(snapshotsRef.current, newMode, { label: '', fallbackLabel }));
    setConfigMode(newMode);
  }, [configMode, readFields, applyPatch, fallbackLabel]);

  const handlePresetChange = useCallback(async (selectedPresetId: string) => {
    if (!selectedPresetId) {
      setPresetId(null);
      return;
    }
    try {
      const preset = await getPresetById(selectedPresetId);
      if (preset) {
        const { snapshots, fields } = applyPresetSelection(snapshotsRef.current, selectedPresetId, preset);
        snapshotsRef.current = snapshots;
        applyPatch(fields);
      }
    } catch (error) {
      logger.debug('[ConfigEditModal] Error loading preset:', error);
    }
  }, [applyPatch]);

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
      fallbackLabel,
    });
    onClose();
  };

  return (
    <EditModalShell
      isOpen={isOpen}
      onClose={onClose}
      onApply={handleApply}
      disabled={hasError}
      title={getMessage('editConfigTitle')}
      data-testid="modal-edit-config"
      maxWidth={820}
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
          autoFocusFirstField
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
          fallbackLabel={fallbackLabel}
          onFallbackLabelChange={setFallbackLabel}
        />
      </Flex>
    </EditModalShell>
  );
}
