import { useCallback, useMemo, useState } from 'react';
import { Badge, Box, Card, Checkbox, Flex, Select, Text, Tooltip } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import {
  resolvePackDescription,
  resolvePackName,
  resolvePackOptionLabel,
  resolvePackParamLabel,
} from '@/utils/packLabel';
import { resolvePackRules, type PackParamSelection } from '@/utils/packResolution';
import type { PackFile } from '@/schemas/pack';
import type { ImportDomainRule } from '@/schemas/importExport';
import { PackRulesPreview } from './PackRulesPreview';

interface PackCardProps {
  pack: PackFile;
  selected: boolean;
  onSelectionChange: (next: { selected: boolean; rules: ImportDomainRule[] }) => void;
}

function buildInitialSelection(pack: PackFile): PackParamSelection {
  if (!pack.pack.configurable) return {};
  return Object.fromEntries(
    pack.pack.configurable.params.map((p) => [p.id, p.default]),
  );
}

export function PackCard({ pack, selected, onSelectionChange }: PackCardProps) {
  const [selection, setSelection] = useState<PackParamSelection>(() =>
    buildInitialSelection(pack),
  );

  const resolvedRules = useMemo(
    () => resolvePackRules(pack, selection),
    [pack, selection],
  );

  const ruleCount = resolvedRules.length;
  const isConfigurable = Boolean(pack.pack.configurable);

  const handleToggle = useCallback(
    (next: boolean) => {
      onSelectionChange({ selected: next, rules: next ? resolvedRules : [] });
    },
    [onSelectionChange, resolvedRules],
  );

  const handleParamChange = useCallback(
    (paramId: string, value: string) => {
      setSelection((prev) => {
        const next = { ...prev, [paramId]: value };
        if (selected) {
          const nextRules = resolvePackRules(pack, next);
          onSelectionChange({ selected: true, rules: nextRules });
        }
        return next;
      });
    },
    [onSelectionChange, pack, selected],
  );

  const name = resolvePackName(pack.pack);
  const description = resolvePackDescription(pack.pack);

  const ruleCountLabel = isConfigurable
    ? ruleCount === 0
      ? getMessage('packGalleryNoRuleConfigured')
      : getMessage('packGalleryConfiguredRuleCount', [String(ruleCount)])
    : getMessage('packGalleryRuleCount', [String(ruleCount)]);

  return (
    <Card
      variant={selected ? 'classic' : 'surface'}
      style={{
        borderColor: selected ? 'var(--accent-9)' : undefined,
      }}
    >
      <Flex direction="column" gap="2">
        <Flex align="start" gap="3">
          <Checkbox
            checked={selected}
            onCheckedChange={(value) => handleToggle(value === true)}
            aria-label={name}
            data-testid={`pack-card-${pack.pack.id}-checkbox`}
          />
          <Flex direction="column" gap="1" style={{ flex: 1 }}>
            <Flex align="center" gap="2" wrap="wrap">
              <Text size="2" weight="medium">
                {name}
              </Text>
              {isConfigurable && (
                <Tooltip content={getMessage('packGalleryConfigurableBadgeTooltip')}>
                  <Badge color="iris" variant="soft" size="1">
                    {getMessage('packGalleryConfigurableBadge')}
                  </Badge>
                </Tooltip>
              )}
              <Badge color="gray" variant="outline" size="1">
                {ruleCountLabel}
              </Badge>
            </Flex>
            {description && (
              <Text size="1" color="gray">
                {description}
              </Text>
            )}
          </Flex>
        </Flex>

        {isConfigurable && pack.pack.configurable && (
          <Box pl="6">
            <Flex gap="2" wrap="wrap">
              {pack.pack.configurable.params.map((param) => (
                <Flex key={param.id} direction="column" gap="1">
                  <Text size="1" color="gray">
                    {resolvePackParamLabel(param)}
                  </Text>
                  <Select.Root
                    value={selection[param.id] ?? param.default}
                    onValueChange={(value) => handleParamChange(param.id, value)}
                  >
                    <Select.Trigger
                      aria-label={resolvePackParamLabel(param)}
                      data-testid={`pack-card-${pack.pack.id}-param-${param.id}`}
                    />
                    <Select.Content>
                      {param.options.map((option) => (
                        <Select.Item key={option.value} value={option.value}>
                          {resolvePackOptionLabel(option)}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Flex>
              ))}
            </Flex>
          </Box>
        )}

        <Box pl="6">
          <PackRulesPreview rules={resolvedRules} packId={pack.pack.id} />
        </Box>
      </Flex>
    </Card>
  );
}
