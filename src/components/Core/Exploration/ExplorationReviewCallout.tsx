import { useCallback, useEffect, useState } from 'react';
import { Button, Callout, Flex, IconButton, Text, Tooltip } from '@radix-ui/themes';
import { Star, X } from 'lucide-react';
import { explorationReviewDismissedItem } from '@/utils/workspaceStorage.js';
import { getStoreReviewUrl } from '@/utils/browserUrls.js';
import { getMessage } from '@/utils/i18n.js';
import { logger } from '@/utils/logger.js';

interface ExplorationReviewCalloutProps {
  /**
   * True once the user has passed the "maîtrise + 1 capacité" milestone. The
   * prompt never renders before this, so it cannot feel like a trap.
   */
  eligible: boolean;
}

/**
 * Discreet, fully dismissable "leave a review" prompt. Shown only on the
 * exploration page, only once the user is eligible, and never again once
 * dismissed (a global flag persists the choice). Renders nothing while the
 * dismissed flag is still loading to avoid a flash.
 */
export function ExplorationReviewCallout({ eligible }: ExplorationReviewCalloutProps) {
  // `null` while loading, then the persisted boolean.
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    explorationReviewDismissedItem
      .getValue()
      .then((v) => {
        if (active) setDismissed(v ?? false);
      })
      .catch((e) => {
        logger.warn('[EXPLORATION] Failed to load review-dismissed flag:', e);
        if (active) setDismissed(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    explorationReviewDismissedItem
      .setValue(true)
      .catch((e) => logger.warn('[EXPLORATION] Failed to persist review-dismissed flag:', e));
  }, []);

  // Nothing before the milestone, nothing while loading, nothing once dismissed.
  if (!eligible || dismissed !== false) return null;

  return (
    <Callout.Root color="gray" variant="soft" size="1" data-testid="exploration-review-prompt">
      <Callout.Icon style={{ color: 'var(--amber-9)' }}>
        <Star size={16} aria-hidden="true" fill="var(--amber-9)" />
      </Callout.Icon>
      <Flex align="center" gap="3" wrap="wrap" style={{ width: '100%' }}>
        <Text size="2" color="gray" highContrast style={{ flex: 1, minWidth: 160 }}>
          {getMessage('explorationReviewPromptText')}
        </Text>
        <Flex align="center" gap="1" flexShrink="0">
          <Button asChild size="1" variant="soft">
            <a
              href={getStoreReviewUrl()}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="exploration-review-link"
            >
              {getMessage('explorationReviewPromptCta')}
            </a>
          </Button>
          <Tooltip content={getMessage('explorationReviewPromptDismiss')}>
            <IconButton
              size="1"
              variant="ghost"
              color="gray"
              aria-label={getMessage('explorationReviewPromptDismiss')}
              title={getMessage('explorationReviewPromptDismiss')}
              onClick={handleDismiss}
              data-testid="exploration-review-dismiss"
            >
              <X size={15} aria-hidden="true" />
            </IconButton>
          </Tooltip>
        </Flex>
      </Flex>
    </Callout.Root>
  );
}
