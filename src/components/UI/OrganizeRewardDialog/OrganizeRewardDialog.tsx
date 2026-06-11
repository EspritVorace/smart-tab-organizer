import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { Button, Dialog, Flex, Text, VisuallyHidden } from '@radix-ui/themes';
import { Sparkles } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { logger } from '@/utils/logger';
import type { MessageResponse } from '@/types/messages';

export interface OrganizeRewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Immediate-reward dialog (issue #433): offered right after a hero-initiated
 * import. The "Organize now" button triggers the existing Organize flow on the
 * current window and announces the outcome in an aria-live region. No automatic
 * destructive action: organizing requires an explicit click.
 */
export function OrganizeRewardDialog({ open, onOpenChange }: OrganizeRewardDialogProps) {
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // Reset transient state whenever the dialog is (re)opened.
  useEffect(() => {
    if (open) {
      setIsOrganizing(false);
      setResultMessage(null);
    }
  }, [open]);

  const handleOrganizeNow = async () => {
    setIsOrganizing(true);
    try {
      const response = (await browser.runtime.sendMessage({
        type: 'ORGANIZE_ALL_TABS_AWAIT',
      })) as MessageResponse | undefined;
      const organize = response?.organize;
      if (!organize || organize.noop) {
        setResultMessage(getMessage('organizeRewardNoop'));
      } else {
        setResultMessage(
          getMessage('organizeRewardDone', [
            String(organize.tabsGrouped),
            String(organize.groupCount),
            String(organize.removedCount),
          ]),
        );
      }
    } catch (error) {
      logger.debug('[OrganizeRewardDialog] organize failed:', error);
      setResultMessage(getMessage('organizeRewardNoop'));
    } finally {
      setIsOrganizing(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="420px" data-testid="organize-reward-dialog">
        <Dialog.Title>{getMessage('organizeRewardTitle')}</Dialog.Title>
        <Dialog.Description size="2" color="gray">
          {getMessage('organizeRewardMessage')}
        </Dialog.Description>

        {/* Polite live region: announces the organize outcome to screen readers. */}
        <Text
          as="p"
          size="2"
          mt="3"
          role="status"
          aria-live="polite"
          data-testid="organize-reward-result"
        >
          {resultMessage ?? <VisuallyHidden>&nbsp;</VisuallyHidden>}
        </Text>

        <Flex gap="3" mt="4" justify="end">
          {resultMessage ? (
            <Dialog.Close>
              <Button variant="soft" color="gray" data-testid="organize-reward-close">
                {getMessage('close')}
              </Button>
            </Dialog.Close>
          ) : (
            <>
              <Dialog.Close>
                <Button variant="soft" color="gray" data-testid="organize-reward-later">
                  {getMessage('organizeRewardLater')}
                </Button>
              </Dialog.Close>
              <Button
                variant="solid"
                onClick={handleOrganizeNow}
                disabled={isOrganizing}
                data-testid="organize-reward-organize"
              >
                <Sparkles size={16} aria-hidden="true" />
                {getMessage('organizeRewardOrganizeNow')}
              </Button>
            </>
          )}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
