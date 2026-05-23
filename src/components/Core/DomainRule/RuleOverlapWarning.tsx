import { HoverCard, Text, Flex } from '@radix-ui/themes';
import { AlertTriangle } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import type { DomainRuleSetting } from '@/types/syncSettings';

export interface RuleOverlapWarningProps {
  /** Id of the rule shown on the parent card (highlighted in the list). */
  currentRuleId: string;
  /**
   * All enabled rules covering the same domain space, including the current
   * one, in runtime precedence order (i.e. the order of the global
   * `domainRules` array). Must contain at least 2 entries for the warning to
   * be meaningful.
   */
  precedenceList: DomainRuleSetting[];
}

export function RuleOverlapWarning({
  currentRuleId,
  precedenceList,
}: RuleOverlapWarningProps) {
  if (precedenceList.length < 2) return null;

  const total = String(precedenceList.length);

  return (
    <HoverCard.Root>
      <HoverCard.Trigger>
        <button
          type="button"
          aria-label={getMessage('ruleOverlapAriaLabel', [total])}
          data-testid="rule-overlap-warning"
          style={{
            background: 'none',
            border: 0,
            padding: 0,
            margin: 0,
            cursor: 'help',
            display: 'inline-flex',
            alignItems: 'center',
            flexShrink: 0,
            lineHeight: 0,
            color: 'inherit',
            borderRadius: 'var(--radius-2)',
          }}
        >
          <AlertTriangle
            size={14}
            aria-hidden="true"
            style={{ color: 'var(--orange-9)' }}
          />
        </button>
      </HoverCard.Trigger>
      <HoverCard.Content size="2" style={{ maxWidth: 320 }}>
        <Flex direction="column" gap="2">
          <Text size="1" weight="bold">
            {getMessage('ruleOverlapHoverCardTitle')}
          </Text>
          <Text size="1" color="gray">
            {getMessage('ruleOverlapHoverCardDescription')}
          </Text>
          <ol style={{ paddingLeft: '1.25rem', margin: 0 }}>
            {precedenceList.map((rule) => {
              const isCurrent = rule.id === currentRuleId;
              return (
                <li key={rule.id}>
                  <Text size="1" weight={isCurrent ? 'bold' : 'regular'}>
                    {rule.label}
                  </Text>
                </li>
              );
            })}
          </ol>
        </Flex>
      </HoverCard.Content>
    </HoverCard.Root>
  );
}
