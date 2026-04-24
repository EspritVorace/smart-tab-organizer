import { Flex, TextField } from '@radix-ui/themes';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { getMessage } from '@/utils/i18n';
import { FormField } from '@/components/Form/FormFields';
import { TextFieldWithCategory } from '@/components/Form/FormFields/TextFieldWithCategory';
import type { DomainRule } from '@/schemas/domainRule';
import type { RuleCategoryId } from '@/schemas/enums';

interface WizardStep1IdentityProps {
  control: Control<DomainRule>;
  errors: FieldErrors<DomainRule>;
}

export function WizardStep1Identity({ control, errors }: WizardStep1IdentityProps) {
  return (
    <Flex direction="column" gap="4">
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
                      categoryId={catField.value as RuleCategoryId | null | undefined}
                      onCategoryChange={catField.onChange}
                    />
                  )}
                />
              )}
            />
          </div>
        )}
      </FormField>

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
    </Flex>
  );
}
