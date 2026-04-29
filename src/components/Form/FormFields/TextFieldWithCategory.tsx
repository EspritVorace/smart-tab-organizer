import { forwardRef } from 'react';
import { Box, Flex, TextField } from '@radix-ui/themes';
import { CategoryPicker } from '@/components/Core/DomainRule/CategoryPicker';

export interface TextFieldWithCategoryProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  maxLength?: number;
  id?: string;
  name?: string;
  'data-testid'?: string;
  'aria-label'?: string;
  disabled?: boolean;
  categoryId: string | null | undefined;
  onCategoryChange: (id: string | null) => void;
}

export const TextFieldWithCategory = forwardRef<HTMLInputElement, TextFieldWithCategoryProps>(
  function TextFieldWithCategory(
    {
      value,
      onChange,
      onBlur,
      placeholder,
      maxLength,
      id,
      name,
      'data-testid': dataTestId,
      'aria-label': ariaLabel,
      disabled,
      categoryId,
      onCategoryChange,
    },
    ref,
  ) {
    return (
      <Flex align="center" gap="2">
        <Box style={{ flex: 1 }}>
          <TextField.Root
            ref={ref}
            id={id}
            name={name}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            maxLength={maxLength}
            data-testid={dataTestId}
            aria-label={ariaLabel}
            disabled={disabled}
            style={{ width: '100%' }}
          />
        </Box>
        <CategoryPicker value={categoryId} onChange={onCategoryChange} />
      </Flex>
    );
  },
);
