import { useId, useState } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Box, Flex } from '@radix-ui/themes';
import { ChevronRight } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { DomainRuleCard } from '@/components/Core/DomainRule/DomainRuleCard';
import type { ImportDomainRule } from '@/schemas/importExport';
import type { DomainRuleSetting } from '@/types/syncSettings';
import styles from '../PackGallery.module.css';

interface PackRulesPreviewProps {
  rules: ImportDomainRule[];
  packId: string;
}

export function PackRulesPreview({ rules, packId }: PackRulesPreviewProps) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  if (rules.length === 0) {
    return null;
  }

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className={styles.previewToggle}
          data-testid={`pack-card-${packId}-rules-toggle`}
          aria-expanded={open}
          aria-controls={contentId}
        >
          <ChevronRight
            size={12}
            aria-hidden="true"
            className={styles.previewChevron}
          />
          {getMessage('packGalleryViewRules')}
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content id={contentId}>
        <Box mt="2">
          <Flex direction="column" gap="2">
            {rules.map((rule) => (
              <DomainRuleCard
                key={rule.id}
                rule={rule as DomainRuleSetting}
                variant="summary"
              />
            ))}
          </Flex>
        </Box>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
