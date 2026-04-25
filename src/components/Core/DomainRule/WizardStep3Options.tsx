import { Box, Flex, Grid, Switch } from '@radix-ui/themes';
import { Controller, type Control, type FieldErrors, useWatch } from 'react-hook-form';
import { getMessage } from '@/utils/i18n';
import { FieldLabel, RadioGroupField, TagInputField } from '@/components/Form/FormFields';
import { deduplicationMatchModeOptions } from '@/schemas/enums';
import type { DomainRule } from '@/schemas/domainRule';

interface WizardStep3OptionsProps {
  control: Control<DomainRule>;
  deduplicationEnabled: boolean;
  errors?: FieldErrors<DomainRule>;
}

const IGNORED_PARAM_PATTERN = /^[A-Za-z0-9_\-.*]+$/;

export function WizardStep3Options({ control, deduplicationEnabled, errors }: WizardStep3OptionsProps) {
  const matchMode = useWatch({ control, name: 'deduplicationMatchMode' });
  const showIgnoredParams = deduplicationEnabled && matchMode === 'exact_ignore_params';

  return (
    <Flex direction="column" gap="4">
      <Grid columns="2" gap="4">
        {/* Enable Deduplication */}
        <Flex direction="column">
          <FieldLabel>{getMessage('enableDeduplication')}</FieldLabel>
          <Flex align="center" style={{ marginTop: '4px' }}>
            <Controller
              name="deduplicationEnabled"
              control={control}
              render={({ field }) => (
                <Switch
                  aria-label={getMessage('enableDeduplication')}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </Flex>
        </Flex>

        {/* Deduplication Match Mode */}
        {deduplicationEnabled ? (
          <RadioGroupField
            label={getMessage('deduplicationMode')}
            name="deduplicationMatchMode"
            options={deduplicationMatchModeOptions}
            control={control}
          />
        ) : (
          <Box />
        )}
      </Grid>

      {showIgnoredParams && (
        <TagInputField<DomainRule>
          name="ignoredQueryParams"
          control={control}
          label={getMessage('ignoredQueryParamsLabel')}
          placeholder={getMessage('ignoredQueryParamsPlaceholder')}
          helpText={getMessage('ignoredQueryParamsHelp')}
          removeTagAriaLabel={getMessage('ignoredQueryParamsRemoveAria')}
          validateTag={IGNORED_PARAM_PATTERN}
          maxTags={50}
          required
          error={errors?.ignoredQueryParams as { message?: string } | undefined}
        />
      )}
    </Flex>
  );
}
