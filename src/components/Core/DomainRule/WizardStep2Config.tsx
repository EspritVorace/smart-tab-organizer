import { useController, type Control, type FieldErrors } from 'react-hook-form';
import type { DomainRule } from '../../../schemas/domainRule';
import type { PresetCategory } from '../../../utils/presetUtils';
import { type GroupNameSourceValue } from '../../../schemas/enums';
import { DomainRuleConfigForm } from './DomainRuleConfigForm';
import type { ConfigMode } from './ConfigModeSelector';

interface WizardStep2ConfigProps {
  control: Control<DomainRule>;
  errors: FieldErrors<DomainRule>;
  configMode: ConfigMode;
  onConfigModeChange: (mode: ConfigMode) => void;
  presetCategories: PresetCategory[];
  isLoadingPresets: boolean;
  handlePresetChange: (presetId: string) => void;
  groupNameSource: GroupNameSourceValue;
}

/**
 * Wizard step wiring the shared DomainRuleConfigForm to a react-hook-form Control.
 * Each field uses useController so validation triggers on change.
 */
export function WizardStep2Config({
  control,
  errors,
  configMode,
  onConfigModeChange,
  presetCategories,
  isLoadingPresets,
  handlePresetChange,
  groupNameSource,
}: WizardStep2ConfigProps) {
  const { field: presetField } = useController({ name: 'presetId', control });
  const { field: groupNameSourceField } = useController({ name: 'groupNameSource', control });
  const { field: titleField } = useController({ name: 'titleParsingRegEx', control });
  const { field: urlField } = useController({ name: 'urlParsingRegEx', control });

  return (
    <DomainRuleConfigForm
      configMode={configMode}
      onConfigModeChange={onConfigModeChange}
      presetId={presetField.value ?? null}
      onPresetChange={handlePresetChange}
      presetCategories={presetCategories}
      isLoadingPresets={isLoadingPresets}
      groupNameSource={groupNameSource}
      onGroupNameSourceChange={(value) => groupNameSourceField.onChange(value)}
      titleParsingRegEx={titleField.value ?? ''}
      onTitleParsingRegExChange={(value) => titleField.onChange(value)}
      titleParsingRegExError={errors.titleParsingRegEx}
      urlParsingRegEx={urlField.value ?? ''}
      onUrlParsingRegExChange={(value) => urlField.onChange(value)}
      urlParsingRegExError={errors.urlParsingRegEx}
    />
  );
}
