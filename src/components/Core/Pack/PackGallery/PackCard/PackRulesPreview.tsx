import { useState } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Box, Flex, Text } from '@radix-ui/themes';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { chromeGroupColors } from '@/utils/tabTreeUtils';
import type { ImportDomainRule } from '@/schemas/importExport';

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
            <ChevronDown size={13} aria-hidden="true" />
          ) : (
            <ChevronRight size={13} aria-hidden="true" />
          )}
          <Text size="1" color="gray">
            {getMessage('packGalleryViewRules')}
          </Text>
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Box mt="2">
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 'var(--font-size-1)',
            }}
          >
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--gray-11)' }}>
                <th style={{ paddingBlock: 'var(--space-1)', fontWeight: 500 }}>
                  {getMessage('packGalleryRuleColumnName')}
                </th>
                <th style={{ paddingBlock: 'var(--space-1)', fontWeight: 500 }}>
                  {getMessage('packGalleryRuleColumnDomain')}
                </th>
                <th
                  style={{
                    paddingBlock: 'var(--space-1)',
                    fontWeight: 500,
                    width: 56,
                  }}
                >
                  {getMessage('packGalleryRuleColumnColor')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => {
                const colorKey = rule.color ?? 'grey';
                const swatch = chromeGroupColors[colorKey] ?? chromeGroupColors.grey;
                return (
                  <tr
                    key={rule.id}
                    style={{ borderTop: '1px solid var(--gray-4)' }}
                  >
                    <td style={{ paddingBlock: 'var(--space-1)' }}>{rule.label}</td>
                    <td
                      style={{
                        paddingBlock: 'var(--space-1)',
                        color: 'var(--gray-11)',
                      }}
                    >
                      {rule.domainFilter}
                    </td>
                    <td style={{ paddingBlock: 'var(--space-1)' }}>
                      <Flex align="center">
                        <span
                          aria-hidden="true"
                          style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: swatch,
                          }}
                        />
                      </Flex>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
