import React, { useState, useMemo, useCallback } from 'react';
import { Button, Switch, Text, HoverCard, Box, Flex, Badge } from '@radix-ui/themes';
import { Edit, Trash2, Plus, Eye, EyeOff, Shield } from 'lucide-react';
import { PageLayout } from '../components/UI/PageLayout/PageLayout';
import { DataTable } from '../components/UI/DataTable/DataTable';
import { DomainRuleFormModal } from '../components/Core/DomainRule/DomainRuleFormModal';
import { getMessage } from '../utils/i18n';
import { generateUUID, getRadixColor } from '../utils/utils';
import type { SyncSettings, DomainRuleSetting } from '../types/syncSettings';
import type { DomainRule } from '../schemas/domainRule';
import type { ColumnDefinition, Action } from '../components/UI/DataTable/types';

interface DomainRulesPageProps {
  syncSettings: SyncSettings;
  updateRules: (rules: DomainRuleSetting[]) => void;
}

export function DomainRulesPage({ syncSettings, updateRules }: DomainRulesPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DomainRule | undefined>(undefined);

  // Handlers - déclarés avant les useMemo
  const handleToggleEnabled = useCallback((ruleId: string, enabled: boolean) => {
    const updatedRules = syncSettings.domainRules.map(rule =>
      rule.id === ruleId ? { ...rule, enabled } : rule
    );
    updateRules(updatedRules);
  }, [syncSettings.domainRules, updateRules]);

  const handleDeleteRule = useCallback((ruleId: string) => {
    const updatedRules = syncSettings.domainRules.filter(rule => rule.id !== ruleId);
    updateRules(updatedRules);
  }, [syncSettings.domainRules, updateRules]);

  const handleBulkToggle = useCallback((ruleIds: string[], enabled: boolean) => {
    const updatedRules = syncSettings.domainRules.map(rule =>
      ruleIds.includes(rule.id) ? { ...rule, enabled } : rule
    );
    updateRules(updatedRules);
  }, [syncSettings.domainRules, updateRules]);

  const handleBulkDelete = useCallback((ruleIds: string[]) => {
    const updatedRules = syncSettings.domainRules.filter(rule => !ruleIds.includes(rule.id));
    updateRules(updatedRules);
  }, [syncSettings.domainRules, updateRules]);

  // Définition des colonnes du DataTable
  const columns: ColumnDefinition<DomainRuleSetting>[] = useMemo(() => [
    {
      key: 'enabled',
      label: getMessage('enabled'),
      width: '80px',
      align: 'center',
      render: (value: boolean, row: DomainRuleSetting) => (
        <Switch
          checked={value}
          onCheckedChange={(checked) => handleToggleEnabled(row.id, checked)}
        />
      )
    },
    {
      key: 'color',
      label: getMessage('tabGroupColor'),
      width: '100px',
      align: 'center',
      render: (value: string) => (
        <div
          style={{
            width: '24px',
            height: '16px',
            backgroundColor: `var(--${getRadixColor(value)}-9)`,
            borderRadius: '4px',
            border: '1px solid var(--gray-6)'
          }}
        />
      )
    },
    {
      key: 'label',
      label: getMessage('labelLabel'),
      render: (value: string, row: DomainRuleSetting) => (
        <HoverCard.Root>
          <HoverCard.Trigger>
            <Text weight="medium" style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}>{value}</Text>
          </HoverCard.Trigger>
          <HoverCard.Content size="2" style={{ maxWidth: 400 }}>
            <Flex direction="column" gap="3">
              {/* Header */}
              <Flex justify="between" align="center" pb="2" style={{ borderBottom: '1px solid var(--gray-5)' }}>
                <Text size="3" weight="bold">{row.label}</Text>
                <Badge color={row.enabled ? 'green' : 'gray'} variant="soft">
                  {getMessage(row.enabled ? 'enabled' : 'disabled')}
                </Badge>
              </Flex>

              {/* Liste des propriétés */}
              <Box style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 12px', alignItems: 'baseline' }}>
                <Text size="1" weight="bold" color="gray">{getMessage('domainFilter')}</Text>
                <Text size="2"><code style={{ backgroundColor: 'var(--gray-3)', padding: '2px 6px', borderRadius: '4px' }}>{row.domainFilter}</code></Text>

                <Text size="1" weight="bold" color="gray">{getMessage('tabGroupColor')}</Text>
                <Flex align="center" gap="2">
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: `var(--${getRadixColor(row.color)}-9)`,
                      borderRadius: '4px',
                      border: '1px solid var(--gray-6)'
                    }}
                  />
                  <Text size="2">{getMessage(`color_${row.color}`)}</Text>
                </Flex>

                <Text size="1" weight="bold" color="gray">{getMessage('groupNameSource')}</Text>
                <Text size="2">{getMessage(`groupNameSource${row.groupNameSource.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')}`)}</Text>

                {row.presetId && (
                  <>
                    <Text size="1" weight="bold" color="gray">{getMessage('presetLabel')}</Text>
                    <Text size="2">{row.presetId}</Text>
                  </>
                )}

                {row.titleParsingRegEx && (
                  <>
                    <Text size="1" weight="bold" color="gray">{getMessage('titleRegex')}</Text>
                    <Text size="2"><code style={{ backgroundColor: 'var(--gray-3)', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all' }}>{row.titleParsingRegEx}</code></Text>
                  </>
                )}

                {row.urlParsingRegEx && (
                  <>
                    <Text size="1" weight="bold" color="gray">{getMessage('urlRegex')}</Text>
                    <Text size="2"><code style={{ backgroundColor: 'var(--gray-3)', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all' }}>{row.urlParsingRegEx}</code></Text>
                  </>
                )}

                <Text size="1" weight="bold" color="gray">{getMessage('deduplicationMode')}</Text>
                <Text size="2">{getMessage(`${row.deduplicationMatchMode}Match`)}</Text>

                <Text size="1" weight="bold" color="gray">{getMessage('deduplicationEnabled')}</Text>
                <Badge size="1" color={row.deduplicationEnabled ? 'green' : 'red'} variant="soft">
                  {row.deduplicationEnabled ? getMessage('yes') : getMessage('no')}
                </Badge>
              </Box>
            </Flex>
          </HoverCard.Content>
        </HoverCard.Root>
      )
    }
  ], [handleToggleEnabled]);

  // Actions sur les lignes individuelles
  const rowActions: Action<DomainRuleSetting>[] = useMemo(() => [
    {
      label: getMessage('edit'),
      icon: Edit,
      variant: 'secondary',
      handler: (rule: DomainRuleSetting) => {
        // Convertir DomainRuleSetting en DomainRule en retirant les propriétés additionnelles
        const { enabled, badge, ...domainRule } = rule;
        setEditingRule(domainRule);
        setIsModalOpen(true);
      }
    },
    {
      label: getMessage('delete'),
      icon: Trash2,
      variant: 'soft',
      color: 'red',
      handler: (rule: DomainRuleSetting) => {
        if (confirm(getMessage('confirmDeleteRule'))) {
          handleDeleteRule(rule.id);
        }
      }
    }
  ], [handleDeleteRule]);

  // Actions bulk
  const bulkActions: Action<DomainRuleSetting[]>[] = useMemo(() => [
    {
      label: getMessage('enableSelected'),
      icon: Eye,
      variant: 'primary',
      handler: (rules: DomainRuleSetting[]) => {
        handleBulkToggle(rules.map(r => r.id), true);
      }
    },
    {
      label: getMessage('disableSelected'),
      icon: EyeOff,
      variant: 'secondary',
      handler: (rules: DomainRuleSetting[]) => {
        handleBulkToggle(rules.map(r => r.id), false);
      }
    },
    {
      label: getMessage('deleteSelected'),
      icon: Trash2,
      variant: 'soft',
      color: 'red',
      handler: (rules: DomainRuleSetting[]) => {
        if (confirm(getMessage('confirmDeleteSelected'))) {
          handleBulkDelete(rules.map(r => r.id));
        }
      }
    }
  ], [handleBulkToggle, handleBulkDelete]);

  const handleAddRule = () => {
    setEditingRule(undefined);
    setIsModalOpen(true);
  };

  const handleSubmitRule = (rule: DomainRule) => {
    if (editingRule) {
      // Édition - trouver la règle originale pour préserver enabled et badge
      const originalRule = syncSettings.domainRules.find(r => r.id === rule.id);
      const updatedRule: DomainRuleSetting = {
        ...rule,
        enabled: originalRule?.enabled ?? true,
        badge: originalRule?.badge
      };
      const updatedRules = syncSettings.domainRules.map(r =>
        r.id === rule.id ? updatedRule : r
      );
      updateRules(updatedRules);
    } else {
      // Création
      const newRule: DomainRuleSetting = {
        ...rule,
        id: generateUUID(),
        enabled: true
      };
      updateRules([...syncSettings.domainRules, newRule]);
    }
    setIsModalOpen(false);
    setEditingRule(undefined);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRule(undefined);
  };

  // Action d'en-tête
  const headerActions = (
    <Button onClick={handleAddRule}>
      <Plus size={16} />
      {getMessage('addRule')}
    </Button>
  );

  return (
    <>
      <PageLayout
        titleKey="domainRulesTab"
        theme="DOMAIN_RULES"
        icon={Shield}
        syncSettings={syncSettings}
        headerActions={headerActions}
      >
        {(settings) => (
          <DataTable
            data={settings.domainRules}
            columns={columns}
            rowActions={rowActions}
            bulkActions={bulkActions}
            searchableFields={['label', 'domainFilter']}
            selectionMode="multiple"
            searchPlaceholder={getMessage('searchRules')}
            emptyStateMessage={getMessage('noRulesFound')}
            keyField="id"
          />
        )}
      </PageLayout>

      <DomainRuleFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitRule}
        domainRule={editingRule}
        syncSettings={syncSettings}
      />
    </>
  );
}