import { Text } from '@radix-ui/themes';

interface FieldLabelProps {
  children: React.ReactNode;
  required?: boolean;
}

export function FieldLabel({ children, required = false }: FieldLabelProps) {
  return (
    <Text as="label" size="2" weight="bold">
      {children}
      {required && <Text color="red" style={{ marginLeft: '2px' }}>*</Text>}
    </Text>
  );
}