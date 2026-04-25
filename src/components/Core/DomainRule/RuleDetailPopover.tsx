import { Flex, Text, Box, Badge } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import { AccessibleHighlight } from '@/components/UI/AccessibleHighlight/AccessibleHighlight';
import { getRadixColor } from '@/utils/utils';
import { deduplicationMatchModeOptions } from '@/schemas/enums';
import { getRuleCategory, getCategoryLabel } from '@/utils/categoriesStore';
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
        <Badge color={rule.enabled ? 'green' : 'gray'} variant="soft" highContrast>
          {getMessage(rule.enabled ? 'enabled' : 'disabled')}
        </Badge>
      </Flex>

      <Box style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 12px', alignItems: 'baseline' }}>
        <Text size="1" weight="bold" color="gray" highContrast>{getMessage('domainFilter')}</Text>
        <Text size="2">
          <code style={{ backgroundColor: 'var(--gray-3)', padding: '2px 6px', borderRadius: '4px' }}>
            <AccessibleHighlight text={rule.domainFilter} searchTerm={searchTerm} />
          </code>
        </Text>

        <Text size="1" weight="bold" color="gray" highContrast>{getMessage('tabGroupColor')}</Text>
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
              <Text size="2">{getCategoryLabel(cat)}</Text>
            </>
          ) : (
            <Text size="2" color="gray" highContrast>{getMessage('categoryNone')}</Text>
          )}
        </Flex>

        <Text size="1" weight="bold" color="gray" highContrast>{getMessage('groupNameSource')}</Text>
        <Text size="2">
          {getMessage(`groupNameSource${rule.groupNameSource.split('_').map(
            (part: string) => part.charAt(0).toUpperCase() + part.slice(1)
          ).join('')}`)}
        </Text>

        {rule.presetId && (
          <>
            <Text size="1" weight="bold" color="gray" highContrast>{getMessage('presetLabel')}</Text>
            <Text size="2">{rule.presetId}</Text>
          </>
        )}
        {rule.titleParsingRegEx && (
          <>
            <Text size="1" weight="bold" color="gray" highContrast>{getMessage('titleRegex')}</Text>
            <Text size="2">
              <code style={{ backgroundColor: 'var(--gray-3)', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all' }}>
                {rule.titleParsingRegEx}
              </code>
            </Text>
          </>
        )}
        {rule.urlParsingRegEx && (
          <>
            <Text size="1" weight="bold" color="gray" highContrast>{getMessage('urlRegex')}</Text>
            <Text size="2">
              <code style={{ backgroundColor: 'var(--gray-3)', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all' }}>
                {rule.urlParsingRegEx}
              </code>
            </Text>
          </>
        )}

        <Text size="1" weight="bold" color="gray" highContrast>{getMessage('deduplicationMode')}</Text>
        <Text size="2">
          {(() => {
            const modeOption = deduplicationMatchModeOptions.find(o => o.value === rule.deduplicationMatchMode);
            return modeOption ? getMessage(modeOption.keyLabel) : rule.deduplicationMatchMode;
          })()}
        </Text>

        {rule.deduplicationEnabled
          && rule.deduplicationMatchMode === 'exact_ignore_params'
          && Array.isArray(rule.ignoredQueryParams)
          && rule.ignoredQueryParams.length > 0 && (
            <>
              <Text size="1" weight="bold" color="gray" highContrast>{getMessage('ignoredQueryParamsLabel')}</Text>
              <Text size="2" style={{ wordBreak: 'break-all' }}>
                {rule.ignoredQueryParams.join(', ')}
              </Text>
            </>
        )}

        <Text size="1" weight="bold" color="gray" highContrast>{getMessage('deduplicationEnabled')}</Text>
        <Badge size="1" color={rule.deduplicationEnabled ? 'green' : 'red'} variant="soft" highContrast>
          {rule.deduplicationEnabled ? getMessage('yes') : getMessage('no')}
        </Badge>
      </Box>
    </Flex>
  );
}
