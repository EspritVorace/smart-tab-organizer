import { useId } from 'react';
import { Box } from '@radix-ui/themes';
import { FieldLabel } from './FieldLabel';
import { FieldError } from './FieldError';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: {
    message?: string;
  };
  /**
   * Children can be a ReactNode or a render function receiving the generated
   * field id and the error element id. Use the render function to associate a
   * non-wrappable control (TextField, TextArea, Select.Trigger, SearchableSelect)
   * with the field's <label>, and optionally wire `aria-describedby` to the error.
   */
  children: React.ReactNode | ((id: string, errorId: string) => React.ReactNode);
  /** Explicit id for the field control. Defaults to a useId(). */
  id?: string;
}

export function FormField({
  label,
  required = false,
  error,
  children,
  id,
}: FormFieldProps) {
  const fallbackId = useId();
  const fieldId = id ?? fallbackId;
  const errorId = `${fieldId}-error`;
  return (
    <Box>
      <FieldLabel required={required} htmlFor={fieldId}>{label}</FieldLabel>
      {typeof children === 'function' ? children(fieldId, errorId) : children}
      <FieldError error={error} id={error ? errorId : undefined} />
    </Box>
  );
}
