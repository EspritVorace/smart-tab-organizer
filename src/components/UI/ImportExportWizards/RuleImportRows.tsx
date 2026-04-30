import { Flex, Badge, Checkbox } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import type { DomainRuleSetting } from '@/types/syncSettings';
import type { ConflictingRule } from '@/utils/importClassification';
import { DiffPopover, DiffPropertyValues } from './Shared';
import { DomainRuleCard } from '@/components/Core/DomainRule/DomainRuleCard';

/* ─── RuleRow ───────────────────────────────────────────────────────────── */

export interface RuleRowProps {
  rule: DomainRuleSetting;
  checkbox?: boolean;
  checked?: boolean;
  onToggle?: () => void;
  dimmed?: boolean;
  statusBadge?: string;
}

export function RuleRow({ rule, checkbox, checked, onToggle, dimmed, statusBadge }: RuleRowProps) {
  return (
    <DomainRuleCard
      rule={rule}
      variant="summary"
      status={dimmed ? 'identical' : 'default'}
      leading={checkbox ? (
        <Checkbox checked={checked} onCheckedChange={onToggle} aria-label={rule.label} />
      ) : undefined}
      trailing={statusBadge ? (
        <Badge color="gray" variant="outline" size="1">{statusBadge}</Badge>
      ) : undefined}
    />
  );
}

/* ─── ConflictRuleRow ───────────────────────────────────────────────────── */

export interface ConflictRuleRowProps {
  conflict: ConflictingRule;
}

export function ConflictRuleRow({ conflict }: ConflictRuleRowProps) {
  return (
    <DomainRuleCard
      rule={conflict.imported}
      variant="summary"
      status="conflict"
      trailing={
        <DiffPopover entityLabel={conflict.imported.label}>
          <Flex direction="column" gap="3">
            {conflict.differences.map((diff) => (
              <DiffPropertyValues
                key={diff.property}
                label={getMessage(diff.property) || diff.property}
                current={String(diff.currentValue)}
                imported={String(diff.importedValue)}
              />
            ))}
          </Flex>
        </DiffPopover>
      }
    />
  );
}
