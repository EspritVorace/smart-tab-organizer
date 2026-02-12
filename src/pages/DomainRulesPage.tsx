import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Button, Switch, Text, HoverCard, Box, Flex, Badge, Card, Checkbox, IconButton, TextField, Separator } from '@radix-ui/themes';
import { Edit, Trash2, Plus, Eye, EyeOff, Shield, Search, AlertCircle } from 'lucide-react';
import { PageLayout } from '../components/UI/PageLayout/PageLayout';
import { DomainRuleFormModal } from '../components/Core/DomainRule/DomainRuleFormModal';
import { ConfirmDialog } from '../components/UI/ConfirmDialog/ConfirmDialog';
import { getMessage } from '../utils/i18n';
import { generateUUID, getRadixColor } from '../utils/utils';
import type { SyncSettings, DomainRuleSetting } from '../types/syncSettings';
import type { DomainRule } from '../schemas/domainRule';

type DeleteTarget =
  | { type: 'single'; ruleId: string; focusIndex?: number }
  | { type: 'bulk'; ruleIds: string[] };

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

  // Confirm dialog state
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Search & selection state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredRules = useMemo(() => {
    if (!searchTerm) return syncSettings.domainRules;
    const term = searchTerm.toLowerCase();
    return syncSettings.domainRules.filter(rule =>
      rule.label.toLowerCase().includes(term) ||
      rule.domainFilter.toLowerCase().includes(term)
    );
  }, [syncSettings.domainRules, searchTerm]);

  const handleRowSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredRules.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [filteredRules]);

  const isAllSelected = filteredRules.length > 0 && selectedIds.size === filteredRules.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredRules.length;

  const handleEditRule = useCallback((rule: DomainRuleSetting) => {
    const { enabled, badge, ...domainRule } = rule;
    setEditingRule(domainRule);
    setIsModalOpen(true);
  }, []);

  // Keyboard navigation for the card list
  const listRef = useRef<HTMLDivElement>(null);

  const handleCardKeyDown = useCallback((e: React.KeyboardEvent, rule: DomainRuleSetting, index: number) => {
    const cards = listRef.current?.querySelectorAll<HTMLElement>('[role="row"]');
    if (!cards) return;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = cards[index + 1];
        next?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = cards[index - 1];
        prev?.focus();
        break;
      }
      case 'Home': {
        e.preventDefault();
        cards[0]?.focus();
        break;
      }
      case 'End': {
        e.preventDefault();
        cards[cards.length - 1]?.focus();
        break;
      }
      case ' ': {
        // Only toggle selection if focus is on the card itself, not on a child interactive element
        const target = e.target as HTMLElement;
        if (target.getAttribute('role') === 'row') {
          e.preventDefault();
          handleRowSelect(rule.id, !selectedIds.has(rule.id));
        }
        break;
      }
      case 'Enter': {
        const target = e.target as HTMLElement;
        if (target.getAttribute('role') === 'row') {
          e.preventDefault();
          handleEditRule(rule);
        }
        break;
      }
      case 'Delete': {
        const target = e.target as HTMLElement;
        if (target.getAttribute('role') === 'row') {
          e.preventDefault();
          setDeleteTarget({ type: 'single', ruleId: rule.id, focusIndex: index });
        }
        break;
      }
    }
  }, [handleRowSelect, handleEditRule, handleDeleteRule, selectedIds]);

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

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'single') {
      handleDeleteRule(deleteTarget.ruleId);
      // Focus next or previous card after keyboard-initiated deletion
      if (deleteTarget.focusIndex != null) {
        const cards = listRef.current?.querySelectorAll<HTMLElement>('[role="row"]');
        if (cards) {
          const nextFocus = cards[deleteTarget.focusIndex + 1] || cards[deleteTarget.focusIndex - 1];
          setTimeout(() => nextFocus?.focus(), 0);
        }
      }
    } else {
      handleBulkDelete(deleteTarget.ruleIds);
      setSelectedIds(new Set());
    }
    setDeleteTarget(null);
  }, [deleteTarget, handleDeleteRule, handleBulkDelete]);

  return (
    <>
      <PageLayout
        titleKey="domainRulesTab"
        theme="DOMAIN_RULES"
        icon={Shield}
        syncSettings={syncSettings}
      >
        {() => (
          <Box>
            {/* Toolbar: Search + Add */}
            <Flex gap="3" mb="4" align="center">
              <Box style={{ flex: 1 }}>
                <TextField.Root
                  placeholder={getMessage('searchRules')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                >
                  <TextField.Slot>
                    <Search size={16} />
                  </TextField.Slot>
                </TextField.Root>
              </Box>
              <Button onClick={handleAddRule}>
                <Plus size={16} />
                {getMessage('addRule')}
              </Button>
            </Flex>

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <Flex align="center" gap="3" p="2" mb="4" style={{ backgroundColor: 'var(--accent-a3)', borderRadius: 'var(--radius-2)' }}>
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  {...(isIndeterminate && { 'data-indeterminate': true })}
                />
                <Text size="2" weight="medium">
                  {selectedIds.size === 1
                    ? getMessage('dataTableSelectedCountSingular')
                    : getMessage('dataTableSelectedCountPlural').replace('{count}', selectedIds.size.toString())
                  }
                </Text>
                <Separator orientation="vertical" />
                <Flex gap="2">
                  <Button size="1" variant="solid" onClick={() => handleBulkToggle(Array.from(selectedIds), true)}>
                    <Eye size={14} />
                    {getMessage('enableSelected')}
                  </Button>
                  <Button size="1" variant="soft" onClick={() => handleBulkToggle(Array.from(selectedIds), false)}>
                    <EyeOff size={14} />
                    {getMessage('disableSelected')}
                  </Button>
                  <Button size="1" variant="soft" color="red" onClick={() => {
                    setDeleteTarget({ type: 'bulk', ruleIds: Array.from(selectedIds) });
                  }}>
                    <Trash2 size={14} />
                    {getMessage('deleteSelected')}
                  </Button>
                </Flex>
              </Flex>
            )}

            {/* Card List */}
            {filteredRules.length === 0 ? (
              <Box p="8" style={{ textAlign: 'center' }}>
                <AlertCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--gray-8)' }} />
                <Text color="gray">{getMessage('noRulesFound')}</Text>
              </Box>
            ) : (
              <Flex direction="column" gap="3" role="grid" aria-label={getMessage('domainRulesTab')} ref={listRef}>
                {filteredRules.map((rule, index) => (
                  <Card
                    key={rule.id}
                    variant="surface"
                    size="2"
                    role="row"
                    tabIndex={0}
                    aria-selected={selectedIds.has(rule.id)}
                    aria-label={`${rule.label} — ${rule.domainFilter}`}
                    onKeyDown={(e) => handleCardKeyDown(e, rule, index)}
                    style={{
                      opacity: rule.enabled ? 1 : 0.6,
                      transition: 'opacity 0.2s, box-shadow 0.2s',
                    }}
                  >
                    <Flex align="center" justify="between" gap="4">
                      {/* Left: Selection + Toggle */}
                      <Flex align="center" gap="3" role="gridcell">
                        <Checkbox
                          checked={selectedIds.has(rule.id)}
                          onCheckedChange={(checked) => handleRowSelect(rule.id, checked as boolean)}
                        />
                        <Switch
                          size="1"
                          checked={rule.enabled}
                          onCheckedChange={(checked) => handleToggleEnabled(rule.id, checked)}
                        />
                      </Flex>

                      {/* Center: Badge + Domain */}
                      <Flex align="center" gap="3" role="gridcell" style={{ flex: 1, minWidth: 0 }}>
                        <HoverCard.Root>
                          <HoverCard.Trigger>
                            <Badge
                              color={getRadixColor(rule.color) as any}
                              variant="solid"
                              size="2"
                              style={{ cursor: 'pointer', flexShrink: 0 }}
                            >
                              {rule.label}
                            </Badge>
                          </HoverCard.Trigger>
                          <HoverCard.Content size="2" style={{ maxWidth: 400 }}>
                            <Flex direction="column" gap="3">
                              <Flex justify="between" align="center" pb="2" style={{ borderBottom: '1px solid var(--gray-5)' }}>
                                <Text size="3" weight="bold">{rule.label}</Text>
                                <Badge color={rule.enabled ? 'green' : 'gray'} variant="soft">
                                  {getMessage(rule.enabled ? 'enabled' : 'disabled')}
                                </Badge>
                              </Flex>
                              <Box style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 12px', alignItems: 'baseline' }}>
                                <Text size="1" weight="bold" color="gray">{getMessage('domainFilter')}</Text>
                                <Text size="2"><code style={{ backgroundColor: 'var(--gray-3)', padding: '2px 6px', borderRadius: '4px' }}>{rule.domainFilter}</code></Text>

                                <Text size="1" weight="bold" color="gray">{getMessage('tabGroupColor')}</Text>
                                <Flex align="center" gap="2">
                                  <div style={{ width: '16px', height: '16px', backgroundColor: `var(--${getRadixColor(rule.color)}-9)`, borderRadius: '4px', border: '1px solid var(--gray-6)' }} />
                                  <Text size="2">{getMessage(`color_${rule.color}`)}</Text>
                                </Flex>

                                <Text size="1" weight="bold" color="gray">{getMessage('groupNameSource')}</Text>
                                <Text size="2">{getMessage(`groupNameSource${rule.groupNameSource.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')}`)}</Text>

                                {rule.presetId && (
                                  <>
                                    <Text size="1" weight="bold" color="gray">{getMessage('presetLabel')}</Text>
                                    <Text size="2">{rule.presetId}</Text>
                                  </>
                                )}
                                {rule.titleParsingRegEx && (
                                  <>
                                    <Text size="1" weight="bold" color="gray">{getMessage('titleRegex')}</Text>
                                    <Text size="2"><code style={{ backgroundColor: 'var(--gray-3)', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all' }}>{rule.titleParsingRegEx}</code></Text>
                                  </>
                                )}
                                {rule.urlParsingRegEx && (
                                  <>
                                    <Text size="1" weight="bold" color="gray">{getMessage('urlRegex')}</Text>
                                    <Text size="2"><code style={{ backgroundColor: 'var(--gray-3)', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all' }}>{rule.urlParsingRegEx}</code></Text>
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
                          </HoverCard.Content>
                        </HoverCard.Root>

                        <Text size="2" color="gray" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rule.domainFilter}
                        </Text>
                      </Flex>

                      {/* Right: Actions */}
                      <Flex gap="2" align="center" role="gridcell" style={{ flexShrink: 0 }}>
                        <IconButton
                          variant="ghost"
                          color="gray"
                          size="2"
                          title={getMessage('edit')}
                          onClick={() => handleEditRule(rule)}
                        >
                          <Edit size={16} />
                        </IconButton>
                        <IconButton
                          variant="ghost"
                          color="red"
                          size="2"
                          title={getMessage('delete')}
                          onClick={() => {
                            setDeleteTarget({ type: 'single', ruleId: rule.id });
                          }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Flex>
                    </Flex>
                  </Card>
                ))}
              </Flex>
            )}
          </Box>
        )}
      </PageLayout>

      <DomainRuleFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitRule}
        domainRule={editingRule}
        syncSettings={syncSettings}
      />

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleConfirmDelete}
        title={
          deleteTarget?.type === 'bulk'
            ? getMessage('confirmDeleteSelected')
            : getMessage('confirmDeleteRule')
        }
        description={
          deleteTarget?.type === 'bulk'
            ? getMessage('confirmDeleteSelectedDescription')
            : getMessage('confirmDeleteDescription').replace('{item}',
                deleteTarget?.type === 'single'
                  ? syncSettings.domainRules.find(r => r.id === deleteTarget.ruleId)?.label ?? ''
                  : ''
              )
        }
      />
    </>
  );
}