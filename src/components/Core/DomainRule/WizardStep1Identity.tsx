import { useEffect } from 'react';
import { Flex, TextField } from '@radix-ui/themes';
import {
  Controller,
  useFormState,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
} from 'react-hook-form';
import { getMessage } from '@/utils/i18n';
import { markDiscovered } from '@/exploration/progressStore';
import { FormField } from '@/components/Form/FormFields';
import { CategoryRadioGroup } from '@/components/Core/DomainRule/CategoryRadioGroup';
import { ChromeColorPicker } from '@/components/Core/TabTree/ChromeColorPicker';
import { DomainCodeField } from '@/components/UI/DomainCodeField';
import { TabCoverageButton } from '@/components/Core/DomainRule/TabCoverageButton';
import { deriveLabelFromDomain } from '@/utils/labelFromDomain';
import type { DomainRule } from '@/schemas/domainRule';
import type { DomainRuleSetting } from '@/types/syncSettings';
import type { ChromeGroupColor } from '@/types/tabTree';

interface WizardStep1IdentityProps {
  control: Control<DomainRule>;
  errors: FieldErrors<DomainRule>;
  setValue: UseFormSetValue<DomainRule>;
  /** Existing rules used to flag already-managed hosts in the coverage panel. */
  domainRules: DomainRuleSetting[];
}

export function WizardStep1Identity({ control, errors, setValue, domainRules }: WizardStep1IdentityProps) {
  const domainFilter = useWatch({ control, name: 'domainFilter' }) ?? '';
  const label = useWatch({ control, name: 'label' }) ?? '';
  const { dirtyFields } = useFormState({ control, name: ['label', 'fallbackLabel'] });

  // Auto-derive the label from the domain as long as the user hasn't
  // edited the label manually. shouldDirty is false so that further URL
  // changes keep triggering the autofill until the user takes ownership.
  useEffect(() => {
    if (dirtyFields.label) return;
    const derived = deriveLabelFromDomain(domainFilter);
    setValue('label', derived, { shouldDirty: false, shouldValidate: true });
  }, [domainFilter, dirtyFields.label, setValue]);

  // Mirror the label into fallbackLabel until the user takes ownership of it
  // in the Step 2 'label' mode. Keeps the default sensible without leaking the
  // unique-identifier constraint to the group name.
  useEffect(() => {
    if (dirtyFields.fallbackLabel) return;
    setValue('fallbackLabel', label, { shouldDirty: false });
  }, [label, dirtyFields.fallbackLabel, setValue]);

  return (
    <Flex direction="column" gap="4">
      {/* Domain Filter */}
      <FormField
        label={getMessage('domainFilter')}
        required={true}
        error={errors.domainFilter}
      >
        {(fieldId, errorId) => (
          <Controller
            name="domainFilter"
            control={control}
            render={({ field }) => (
              <Flex align="start" gap="2" style={{ marginTop: '4px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <DomainCodeField
                    id={fieldId}
                    describedById={errors.domainFilter ? errorId : undefined}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    name="domainFilter"
                    testId="wizard-rule-field-domain"
                    placeholder={getMessage('domainFilterPlaceholder')}
                    ariaLabel={getMessage('domainFilterEditorAriaLabel')}
                    hasError={Boolean(errors.domainFilter)}
                  />
                </div>
                <TabCoverageButton
                  domainRules={domainRules}
                  onSeed={(value) => {
                    void markDiscovered('grouping.seedFromTabs');
                    field.onChange(value);
                  }}
                />
              </Flex>
            )}
          />
        )}
      </FormField>

      {/* Label */}
      <FormField
        label={getMessage('labelLabel')}
        required={true}
        error={errors.label}
      >
        {(fieldId) => (
          <Controller
            name="label"
            control={control}
            render={({ field }) => (
              <TextField.Root
                {...field}
                value={field.value ?? ''}
                id={fieldId}
                data-testid="wizard-rule-field-label"
                name="label"
                placeholder={getMessage('labelPlaceholder')}
                style={{ marginTop: '4px' }}
              />
            )}
          />
        )}
      </FormField>

      {/* Category */}
      <FormField label={getMessage('categoryPickerLabel')} error={errors.categoryId}>
        {() => (
          <div style={{ marginTop: '4px' }}>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <CategoryRadioGroup
                  value={field.value as string | null | undefined}
                  onChange={(id) => { void markDiscovered('grouping.category'); field.onChange(id); }}
                  data-testid="wizard-rule-field-category"
                  swatchTestIdPrefix="wizard-rule-category"
                />
              )}
            />
          </div>
        )}
      </FormField>

      {/* Tab group color */}
      <FormField label={getMessage('ruleColorLabel')} error={errors.color}>
        {() => (
          <div style={{ marginTop: '4px' }}>
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <ChromeColorPicker
                  value={(field.value ?? 'grey') as ChromeGroupColor}
                  onChange={(color) => { void markDiscovered('grouping.color'); field.onChange(color); }}
                />
              )}
            />
          </div>
        )}
      </FormField>
    </Flex>
  );
}
