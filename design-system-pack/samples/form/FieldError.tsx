import { Text } from '@radix-ui/themes';

interface FieldErrorProps {
  error?: {
    message?: string;
  };
}

export function FieldError({ error }: FieldErrorProps) {
  if (!error) return null;
  
  return (
    <Text size="1" color="red" style={{ marginTop: '2px' }}>
      {error.message}
    </Text>
  );
}