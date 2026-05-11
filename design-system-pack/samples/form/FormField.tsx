import { Box } from '@radix-ui/themes';
import { FieldLabel } from './FieldLabel';
import { FieldError } from './FieldError';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: {
    message?: string;
  };
  children: React.ReactNode;
}

export function FormField({ 
  label, 
  required = false, 
  error, 
  children 
}: FormFieldProps) {
  return (
    <Box>
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
      <FieldError error={error} />
    </Box>
  );
}