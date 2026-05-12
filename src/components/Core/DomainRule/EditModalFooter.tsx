import { Button, Flex } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';

interface EditModalFooterProps {
  onClose: () => void;
  onApply: () => void;
  disabled: boolean;
  applyTestId?: string;
}

export function EditModalFooter({ onClose, onApply, disabled, applyTestId }: EditModalFooterProps) {
  return (
    <Flex gap="3" justify="end" mt="4" style={{ flexShrink: 0 }}>
      <Button variant="soft" color="gray" onClick={onClose}>
        {getMessage('cancel')}
      </Button>
      <Button data-testid={applyTestId} onClick={onApply} disabled={disabled}>
        {getMessage('apply')}
      </Button>
    </Flex>
  );
}
