import { Box, Flex, Grid, Switch } from '@radix-ui/themes';
import { Controller, type Control } from 'react-hook-form';
import { getMessage } from '@/utils/i18n';
import { FieldLabel, RadioGroupField } from '@/components/Form/FormFields';
import { deduplicationMatchModeOptions } from '@/schemas/enums';
import type { DomainRule } from '@/schemas/domainRule';

interface WizardStep3OptionsProps {
  control: Control<DomainRule>;
  deduplicationEnabled: boolean;
}

export function WizardStep3Options({ control, deduplicationEnabled }: WizardStep3OptionsProps) {
  return (
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
  );
}
