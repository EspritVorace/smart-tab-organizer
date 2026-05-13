import { useCallback, useId, useMemo, useState } from 'react';
import { Badge, Box, Checkbox, Flex, Select, Text, Tooltip } from '@radix-ui/themes';
import { Layers, SlidersHorizontal } from 'lucide-react';
import { getMessage, getPluralMessage } from '@/utils/i18n';
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
import styles from '@/components/Core/Pack/PackGallery/PackGallery.module.css';

interface PackCardProps {
  pack: PackFile;
  selected: boolean;
  onSelectionChange: (next: { selected: boolean; rules: ImportDomainRule[] }) => void;
}

function computeRuleCountLabel(isConfigurable: boolean, ruleCount: number): string {
  if (!isConfigurable) {
    return getPluralMessage(ruleCount, 'packGalleryRuleCountOne', 'packGalleryRuleCount');
  }
  if (ruleCount === 0) {
    return getMessage('packGalleryNoRuleConfigured');
  }
  return getPluralMessage(
    ruleCount,
    'packGalleryConfiguredRuleCountOne',
    'packGalleryConfiguredRuleCount',
  );
}

function buildInitialSelection(pack: PackFile): PackParamSelection {
  if (!pack.pack.configurable) return {};
  return Object.fromEntries(
    pack.pack.configurable.params.map((p) => [p.id, p.default]),
  );
}

/**
 * Bloque la propagation du clic et de l'activation clavier vers le
 * <label> englobant (qui sinon toggle la carte). Utilisé autour des
 * sous-zones interactives (Select dropdowns, PackRulesPreview).
 */
function stopActivation(event: React.SyntheticEvent) {
  event.stopPropagation();
}

export function PackCard({ pack, selected, onSelectionChange }: PackCardProps) {
  const [selection, setSelection] = useState<PackParamSelection>(() =>
    buildInitialSelection(pack),
  );

  const resolvedRules = useMemo(
    () => resolvePackRules(pack, selection),
    [pack, selection],
  );

  const checkboxId = useId();
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
  const ruleCountLabel = computeRuleCountLabel(isConfigurable, ruleCount);

  const cardClassName = selected
    ? `${styles.packCard} ${styles.packCardSelected}`
    : styles.packCard;

  return (
    <label
      htmlFor={checkboxId}
      className={cardClassName}
      data-testid={`pack-card-${pack.pack.id}`}
      data-selected={selected ? 'true' : 'false'}
    >
      <Flex align="start" gap="3">
        <Box style={{ paddingTop: 2 }}>
          <Checkbox
            id={checkboxId}
            checked={selected}
            onCheckedChange={(value) => handleToggle(value === true)}
            aria-label={name}
            data-testid={`pack-card-${pack.pack.id}-checkbox`}
          />
        </Box>
        <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
          <Flex align="center" gap="2" wrap="wrap">
            <Text size="3" weight="medium" style={{ color: 'var(--gray-12)' }}>
              {name}
            </Text>
            {isConfigurable && (
              <Tooltip content={getMessage('packGalleryConfigurableBadgeTooltip')}>
                <Badge color="iris" variant="soft" size="1">
                  {getMessage('packGalleryConfigurableBadge')}
                </Badge>
              </Tooltip>
            )}
          </Flex>
          {description && (
            <Text size="2" color="gray">
              {description}
            </Text>
          )}
          <Flex align="center" gap="1" mt="1" style={{ color: 'var(--gray-11)' }}>
            <Layers size={12} aria-hidden="true" />
            <Text size="1" color="gray">
              {ruleCountLabel}
            </Text>
          </Flex>
        </Flex>
      </Flex>

      {isConfigurable && pack.pack.configurable && (
        <Box
          className={styles.configurableBlock}
          onClick={stopActivation}
          onKeyDown={stopActivation}
        >
          <Flex
            align="center"
            gap="1"
            mb="2"
            style={{
              color: 'var(--accent-11)',
              fontSize: 'var(--font-size-1)',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <SlidersHorizontal size={11} aria-hidden="true" />
            <span>{getMessage('packGalleryConfigurableBadge')}</span>
          </Flex>
          <Flex gap="3" wrap="wrap">
            {pack.pack.configurable.params.map((param) => (
              <Flex
                key={param.id}
                direction="column"
                gap="1"
                style={{ minWidth: 140 }}
              >
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

      <Box mt="3" onClick={stopActivation} onKeyDown={stopActivation}>
        <PackRulesPreview rules={resolvedRules} packId={pack.pack.id} />
      </Box>
    </label>
  );
}
