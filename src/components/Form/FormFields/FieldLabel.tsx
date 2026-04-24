import { Text } from '@radix-ui/themes';
import * as Label from '@radix-ui/react-label';

interface FieldLabelProps {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}

export function FieldLabel({ children, required = false, htmlFor }: FieldLabelProps) {
  return (
    <Text size="2" weight="bold" asChild>
      <Label.Root htmlFor={htmlFor}>
        {children}
        {required && <Text color="red" style={{ marginLeft: '2px' }}>*</Text>}
      </Label.Root>
    </Text>
  );
}
