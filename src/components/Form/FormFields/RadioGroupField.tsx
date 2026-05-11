import { Flex, Text, RadioGroup } from '@radix-ui/themes';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { FieldLabel } from './FieldLabel';
import { getMessage } from '@/utils/i18n';

interface RadioOption {
  readonly value: string;
  readonly keyLabel: string;
}

interface RadioGroupFieldProps<TFieldValues extends FieldValues> {
  label: string;
  name: Path<TFieldValues>;
  options: readonly RadioOption[];
  control: Control<TFieldValues>;
  required?: boolean;
  onChange?: (value: string) => void;
}

export function RadioGroupField<TFieldValues extends FieldValues>({
  label,
  name,
  options,
  control,
  required = false,
  onChange
}: RadioGroupFieldProps<TFieldValues>) {
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
                <Text key={option.value} as="label" size="2">
                  <Flex align="center" gap="2">
                    <RadioGroup.Item value={option.value} />
                    {getMessage(option.keyLabel)}
                  </Flex>
                </Text>
              ))}
            </Flex>
          </RadioGroup.Root>
        )}
      />
    </Flex>
  );
}