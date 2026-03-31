import { Box, Flex, TextField } from '@radix-ui/themes';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { getMessage } from '../../../utils/i18n';
import { CategoryPicker } from './CategoryPicker';
import { FormField } from '../../Form/FormFields';
import type { DomainRule } from '../../../schemas/domainRule';

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
        <Flex align="center" gap="2" style={{ marginTop: '4px' }}>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <CategoryPicker value={field.value as any} onChange={field.onChange} />
            )}
          />
          <Box style={{ flex: 1 }}>
            <Controller
              name="label"
              control={control}
              render={({ field }) => (
                <TextField.Root
                  {...field}
                  name="label"
                  placeholder={getMessage('labelPlaceholder')}
                />
              )}
            />
          </Box>
        </Flex>
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
              name="domainFilter"
              placeholder={getMessage('domainFilterPlaceholder')}
              style={{ marginTop: '4px' }}
            />
          )}
        />
      </FormField>
    </Flex>
  );
}
