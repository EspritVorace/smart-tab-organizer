import { AlertDialog, Button, Flex } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';

export interface AlertDialogShellProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Called when the dialog requests to close (e.g. Escape key or overlay click) */
  onClose: () => void;
  /** Max width of the dialog content box */
  maxWidth?: string;
  /** Dialog title node */
  title: React.ReactNode;
  /** Dialog description node */
  description: React.ReactNode;
  /** Label for the soft (non-destructive) secondary action button */
  softActionLabel: string;
  /** Handler for the soft secondary action */
  onSoftAction: () => void;
  /** Label for the destructive (red) primary action button */
  destructiveActionLabel: string;
  /** Handler for the destructive primary action */
  onDestructiveAction: () => void;
}

/**
 * Shared shell for AlertDialogs that present three buttons:
 * Cancel (gray soft), a non-destructive soft action, and a destructive red action.
 *
 * Used by the two AlertDialogs in TabTreeEditor (delete last tab and delete group).
 */
export function AlertDialogShell({
  open,
  onClose,
  maxWidth = '400px',
  title,
  description,
  softActionLabel,
  onSoftAction,
  destructiveActionLabel,
  onDestructiveAction,
}: AlertDialogShellProps) {
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <AlertDialog.Content maxWidth={maxWidth}>
        <AlertDialog.Title>{title}</AlertDialog.Title>
        <AlertDialog.Description size="2">{description}</AlertDialog.Description>
        <Flex gap="2" mt="4" justify="end" wrap="wrap">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">
              {getMessage('cancel')}
            </Button>
          </AlertDialog.Cancel>
          <Button variant="soft" onClick={onSoftAction}>
            {softActionLabel}
          </Button>
          <AlertDialog.Action>
            <Button color="red" onClick={onDestructiveAction}>
              {destructiveActionLabel}
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
