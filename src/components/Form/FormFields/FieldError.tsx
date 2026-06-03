import { Text } from '@radix-ui/themes';

interface FieldErrorProps {
  error?: {
    message?: string;
  };
  /** Id wired onto the message so a control can reference it via aria-describedby. */
  id?: string;
}

export function FieldError({ error, id }: FieldErrorProps) {
  if (!error) return null;

  return (
    <Text id={id} size="1" color="red" style={{ marginTop: '2px' }}>
      {error.message}
    </Text>
  );
}