import { useState } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Box, Flex, Text } from '@radix-ui/themes';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { DomainRuleCard } from '@/components/Core/DomainRule/DomainRuleCard';
import type { ImportDomainRule } from '@/schemas/importExport';
import type { DomainRuleSetting } from '@/types/syncSettings';

interface PackRulesPreviewProps {
  rules: ImportDomainRule[];
  packId: string;
}

export function PackRulesPreview({ rules, packId }: PackRulesPreviewProps) {
  const [open, setOpen] = useState(false);

  if (rules.length === 0) {
    return null;
  }

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger asChild>
        <button
          type="button"
          data-testid={`pack-card-${packId}-rules-toggle`}
          aria-expanded={open}
          style={{
            all: 'unset',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            cursor: 'pointer',
            color: 'var(--gray-11)',
          }}
        >
          {open ? (
            <ChevronDown size={13} />
          ) : (
            <ChevronRight size={13} />
          )}
          <Text size="1" color="gray">
            {getMessage('packGalleryViewRules')}
          </Text>
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content>
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
