import { Flex, Text, Box, Badge } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import { AccessibleHighlight } from '@/components/UI/AccessibleHighlight/AccessibleHighlight';
import { getRadixColor } from '@/utils/utils';
import { getRuleCategory } from '@/schemas/enums';
import type { DomainRuleSetting } from '@/types/syncSettings';

interface RuleDetailPopoverProps {
  rule: DomainRuleSetting;
  searchTerm: string;
}

export function RuleDetailPopover({ rule, searchTerm }: RuleDetailPopoverProps) {
  const cat = getRuleCategory(rule.categoryId);

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center" pb="2" style={{ borderBottom: '1px solid var(--gray-5)' }}>
        <Text size="3" weight="bold">
          <AccessibleHighlight text={rule.label} searchTerm={searchTerm} />
        </Text>
        <Badge color={rule.enabled ? 'green' : 'gray'} variant="soft">
          {getMessage(rule.enabled ? 'enabled' : 'disabled')}
        </Badge>
      </Flex>

      <Box style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 12px', alignItems: 'baseline' }}>
        <Text size="1" weight="bold" color="gray">{getMessage('domainFilter')}</Text>
        <Text size="2">
          <code style={{ backgroundColor: 'var(--gray-3)', padding: '2px 6px', borderRadius: '4px' }}>
            <AccessibleHighlight text={rule.domainFilter} searchTerm={searchTerm} />
          </code>
        </Text>

        <Text size="1" weight="bold" color="gray">{getMessage('tabGroupColor')}</Text>
        <Flex align="center" gap="2">
          {cat ? (
            <>
              <div style={{
                width: '16px', height: '16px',
                backgroundColor: `var(--${getRadixColor(cat.color)}-9)`,
                borderRadius: '50%',
                border: '1px solid var(--gray-6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px',
              }}>
                {cat.emoji}
              </div>
              <Text size="2">{getMessage(cat.labelKey as any)}</Text>
            </>
          ) : (
            <Text size="2" color="gray">{getMessage('categoryNone')}</Text>
          )}
        </Flex>

        <Text size="1" weight="bold" color="gray">{getMessage('groupNameSource')}</Text>
        <Text size="2">
          {getMessage(`groupNameSource${rule.groupNameSource.split('_').map(
            (part: string) => part.charAt(0).toUpperCase() + part.slice(1)
          ).join('')}`)}
        </Text>

        {rule.presetId && (
          <>
            <Text size="1" weight="bold" color="gray">{getMessage('presetLabel')}</Text>
            <Text size="2">{rule.presetId}</Text>
          </>
        )}
        {rule.titleParsingRegEx && (
          <>
            <Text size="1" weight="bold" color="gray">{getMessage('titleRegex')}</Text>
            <Text size="2">
              <code style={{ backgroundColor: 'var(--gray-3)', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all' }}>
                {rule.titleParsingRegEx}
              </code>
            </Text>
          </>
        )}
        {rule.urlParsingRegEx && (
          <>
            <Text size="1" weight="bold" color="gray">{getMessage('urlRegex')}</Text>
            <Text size="2">
              <code style={{ backgroundColor: 'var(--gray-3)', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all' }}>
                {rule.urlParsingRegEx}
              </code>
            </Text>
          </>
        )}

        <Text size="1" weight="bold" color="gray">{getMessage('deduplicationMode')}</Text>
        <Text size="2">{getMessage(`${rule.deduplicationMatchMode}Match`)}</Text>

        <Text size="1" weight="bold" color="gray">{getMessage('deduplicationEnabled')}</Text>
        <Badge size="1" color={rule.deduplicationEnabled ? 'green' : 'red'} variant="soft">
          {rule.deduplicationEnabled ? getMessage('yes') : getMessage('no')}
        </Badge>
      </Box>
    </Flex>
  );
}
