import { Flex, Text, RadioGroup } from '@radix-ui/themes';
import { Controller } from 'react-hook-form';
import { FieldLabel } from './FieldLabel';
import { getMessage } from '../../../utils/i18n';

interface RadioOption {
  readonly value: string;
  readonly keyLabel: string;
}

interface RadioGroupFieldProps {
  label: string;
  name: string;
  options: readonly RadioOption[];
  control: any;
  required?: boolean;
  onChange?: (value: string) => void;
}

export function RadioGroupField({ 
  label, 
  name, 
  options, 
  control,
  required = false,
  onChange
}: RadioGroupFieldProps) {
  return (
    <Flex direction="column">
      <FieldLabel required={required}>{label}</FieldLabel>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <RadioGroup.Root 
            value={field.value as string} 
            onValueChange={(value) => {
              field.onChange(value);
              onChange?.(value);
            }} 
            style={{ marginTop: '4px' }}
          >
            <Flex direction="row" gap="4" wrap="wrap">
              {options.map((option) => (
                <Flex key={option.value} align="center" gap="2">
                  <RadioGroup.Item value={option.value} />
                  <Text size="2">{getMessage(option.keyLabel)}</Text>
                </Flex>
              ))}
            </Flex>
          </RadioGroup.Root>
        )}
      />
    </Flex>
  );
}