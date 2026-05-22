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
import { FormField } from '@/components/Form/FormFields';
import { TextFieldWithCategory } from '@/components/Form/FormFields/TextFieldWithCategory';
import { ChromeColorPicker } from '@/components/Core/TabTree/ChromeColorPicker';
import { deriveLabelFromDomain } from '@/utils/labelFromDomain';
import type { DomainRule } from '@/schemas/domainRule';
import type { ChromeGroupColor } from '@/types/tabTree';

interface WizardStep1IdentityProps {
  control: Control<DomainRule>;
  errors: FieldErrors<DomainRule>;
  setValue: UseFormSetValue<DomainRule>;
}

export function WizardStep1Identity({ control, errors, setValue }: WizardStep1IdentityProps) {
  const domainFilter = useWatch({ control, name: 'domainFilter' }) ?? '';
  const { dirtyFields } = useFormState({ control, name: 'label' });

  // Auto-derive the label from the domain as long as the user hasn't
  // edited the label manually. shouldDirty is false so that further URL
  // changes keep triggering the autofill until the user takes ownership.
  useEffect(() => {
    if (dirtyFields.label) return;
    const derived = deriveLabelFromDomain(domainFilter);
    setValue('label', derived, { shouldDirty: false, shouldValidate: true });
  }, [domainFilter, dirtyFields.label, setValue]);

  return (
    <Flex direction="column" gap="4">
      {/* Domain Filter */}
      <FormField
        label={getMessage('domainFilter')}
        required={true}
        error={errors.domainFilter}
      >
        {(fieldId) => (
          <Controller
            name="domainFilter"
            control={control}
            render={({ field }) => (
              <TextField.Root
                {...field}
                id={fieldId}
                data-testid="wizard-rule-field-domain"
                name="domainFilter"
                placeholder={getMessage('domainFilterPlaceholder')}
                style={{ marginTop: '4px' }}
              />
            )}
          />
        )}
      </FormField>

      {/* Label + Category */}
      <FormField
        label={getMessage('labelLabel')}
        required={true}
        error={errors.label}
      >
        {(fieldId) => (
          <div style={{ marginTop: '4px' }}>
            <Controller
              name="label"
              control={control}
              render={({ field: labelField }) => (
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field: catField }) => (
                    <TextFieldWithCategory
                      id={fieldId}
                      ref={labelField.ref}
                      name={labelField.name}
                      value={labelField.value ?? ''}
                      onChange={labelField.onChange}
                      onBlur={labelField.onBlur}
                      data-testid="wizard-rule-field-label"
                      placeholder={getMessage('labelPlaceholder')}
                      categoryId={catField.value as string | null | undefined}
                      onCategoryChange={catField.onChange}
                    />
                  )}
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
                  onChange={(color) => field.onChange(color)}
                />
              )}
            />
          </div>
        )}
      </FormField>
    </Flex>
  );
}
