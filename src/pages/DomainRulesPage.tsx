import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Button, Text, Flex, Box, Checkbox, IconButton, Separator } from '@radix-ui/themes';
import { Plus, Eye, EyeOff, Shield, AlertCircle, Upload, Trash2 } from 'lucide-react';
import { DragDropProvider, type DragEndEvent, type DragOverEvent } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { PageLayout } from '../components/UI/PageLayout/PageLayout';
import { RuleWizardModal } from '../components/Core/DomainRule/RuleWizardModal';
import { ImportWizard } from '../components/UI/ImportExportWizards/ImportWizard';
import { ConfirmDialog } from '../components/UI/ConfirmDialog/ConfirmDialog';
import { ListToolbar } from '../components/UI/ListToolbar';
import { getMessage } from '../utils/i18n';
import { foldAccents } from '../utils/stringUtils';
import { generateUUID } from '../utils/utils';
import { DomainRuleCard } from '../components/Core/DomainRule/DomainRuleCard';
import {
  moveToFirst,
  moveToLast,
  moveToFirstOfDomain,
  moveToLastOfDomain,
  getRulesForRootDomain,
} from '../utils/ruleOrderUtils';
import type { SyncSettings, DomainRuleSetting } from '../types/syncSettings';
import type { DomainRule } from '../schemas/domainRule';

type DeleteTarget =
  | { type: 'single'; ruleId: string; focusIndex?: number }
  | { type: 'bulk'; ruleIds: string[] };

interface DomainRulesPageProps {
  syncSettings: SyncSettings;
  updateRules: (rules: DomainRuleSetting[]) => void;
}

/* ─── Local presentation components ──────────────────────────────────────── */

interface BulkActionsBarProps {
  selectedIds: Set<string>;
  filteredRules: DomainRuleSetting[];
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onSelectAll: (checked: boolean) => void;
  onBulkToggle: (ids: string[], enabled: boolean) => void;
  onBulkDeleteRequest: (ids: string[]) => void;
}

function BulkActionsBar({
  selectedIds, filteredRules, isAllSelected, isIndeterminate,
  onSelectAll, onBulkToggle, onBulkDeleteRequest,
}: BulkActionsBarProps) {
  return (
    <Flex data-testid="page-rules-bulk-bar" align="center" gap="3" p="2" mb="4"
      style={{ backgroundColor: 'var(--accent-a3)', borderRadius: 'var(--radius-2)' }}>
      <Checkbox
        checked={isAllSelected}
        onCheckedChange={(checked) => onSelectAll(checked as boolean)}
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
        <Button size="1" variant="solid" onClick={() => onBulkToggle(Array.from(selectedIds), true)}>
          <Eye size={14} />
          {getMessage('enableSelected')}
        </Button>
        <Button size="1" variant="soft" onClick={() => onBulkToggle(Array.from(selectedIds), false)}>
          <EyeOff size={14} />
          {getMessage('disableSelected')}
        </Button>
        <Button size="1" variant="soft" color="red"
          onClick={() => onBulkDeleteRequest(Array.from(selectedIds))}>
          <Trash2 size={14} />
          {getMessage('deleteSelected')}
        </Button>
      </Flex>
    </Flex>
  );
}

interface RulesEmptyStateProps {
  hasRules: boolean;
  hasSearch: boolean;
  onAddRule: () => void;
  onImport: () => void;
}

function RulesEmptyState({ hasRules, hasSearch, onAddRule, onImport }: RulesEmptyStateProps) {
  if (!hasRules && !hasSearch) {
    return (
      <Flex data-testid="page-rules-empty" direction="column" align="center" justify="center" gap="3" style={{ minHeight: 200 }}>
        <Shield size={40} style={{ color: 'var(--gray-8)' }} aria-hidden="true" />
        <Text size="3" weight="medium" color="gray" align="center">
          {getMessage('rulesEmptyTitle')}
        </Text>
        <Text size="2" color="gray" align="center" style={{ maxWidth: 340 }}>
          {getMessage('rulesEmptyDescription')}
        </Text>
        <Flex gap="2">
          <Button data-testid="page-rules-btn-add" variant="soft" onClick={onAddRule}>
            <Plus size={14} aria-hidden="true" />
            {getMessage('addRule')}
          </Button>
          <Button variant="soft" onClick={onImport}>
            <Upload size={14} aria-hidden="true" />
            {getMessage('importRulesButton')}
          </Button>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex direction="column" align="center" justify="center" gap="2" style={{ minHeight: 120 }}>
      <AlertCircle size={32} style={{ color: 'var(--gray-8)' }} aria-hidden="true" />
      <Text color="gray">{getMessage('noRulesFound')}</Text>
    </Flex>
  );
}

/* ─── Page component ──────────────────────────────────────────────────────── */

export function DomainRulesPage({ syncSettings, updateRules }: DomainRulesPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DomainRule | undefined>(undefined);
  const [dragItems, setDragItems] = useState<DomainRuleSetting[] | null>(null);

  const handleToggleEnabled = useCallback((ruleId: string, enabled: boolean) => {
    updateRules(syncSettings.domainRules.map(rule =>
      rule.id === ruleId ? { ...rule, enabled } : rule
    ));
  }, [syncSettings.domainRules, updateRules]);

  const handleDeleteRule = useCallback((ruleId: string) => {
    updateRules(syncSettings.domainRules.filter(rule => rule.id !== ruleId));
  }, [syncSettings.domainRules, updateRules]);

  const handleBulkToggle = useCallback((ruleIds: string[], enabled: boolean) => {
    updateRules(syncSettings.domainRules.map(rule =>
      ruleIds.includes(rule.id) ? { ...rule, enabled } : rule
    ));
  }, [syncSettings.domainRules, updateRules]);

  const handleBulkDelete = useCallback((ruleIds: string[]) => {
    updateRules(syncSettings.domainRules.filter(rule => !ruleIds.includes(rule.id)));
  }, [syncSettings.domainRules, updateRules]);

  const handleMoveToFirst = useCallback((ruleId: string) => {
    updateRules(moveToFirst(syncSettings.domainRules, ruleId));
  }, [syncSettings.domainRules, updateRules]);

  const handleMoveToLast = useCallback((ruleId: string) => {
    updateRules(moveToLast(syncSettings.domainRules, ruleId));
  }, [syncSettings.domainRules, updateRules]);

  const handleMoveToFirstOfDomain = useCallback((ruleId: string) => {
    updateRules(moveToFirstOfDomain(syncSettings.domainRules, ruleId));
  }, [syncSettings.domainRules, updateRules]);

  const handleMoveToLastOfDomain = useCallback((ruleId: string) => {
    updateRules(moveToLastOfDomain(syncSettings.domainRules, ruleId));
  }, [syncSettings.domainRules, updateRules]);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredRules = useMemo(() => {
    if (!searchTerm) return syncSettings.domainRules;
    const term = foldAccents(searchTerm);
    return syncSettings.domainRules.filter(rule =>
      foldAccents(rule.label).includes(term) ||
      foldAccents(rule.domainFilter).includes(term)
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
    setSelectedIds(checked ? new Set(filteredRules.map(r => r.id)) : new Set());
  }, [filteredRules]);

  const isAllSelected = filteredRules.length > 0 && selectedIds.size === filteredRules.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredRules.length;

  const handleEditRule = useCallback((rule: DomainRuleSetting) => {
    const { enabled, badge, ...domainRule } = rule;
    setEditingRule(domainRule);
    setIsModalOpen(true);
  }, []);

  // @dnd-kit/helpers' move() is typed as `Items | Record<UniqueIdentifier, Items>`
  // where `Items = UniqueIdentifier[] | { id: UniqueIdentifier }[]`. The union
  // confuses TS inference even though DomainRuleSetting[] is structurally
  // compatible (each rule has `id: string`). Wrap once with the necessary
  // unknown-cast and rely on the helper for the rest.
  const moveRules = (
    rules: DomainRuleSetting[],
    event: Parameters<DragOverEvent>[0] | Parameters<DragEndEvent>[0],
  ): DomainRuleSetting[] =>
    (move as unknown as (
      r: DomainRuleSetting[],
      e: typeof event,
    ) => DomainRuleSetting[])(rules, event);

  const handleDragOver = useCallback((event: Parameters<DragOverEvent>[0]) => {
    setDragItems(prev => moveRules(prev ?? syncSettings.domainRules, event));
  }, [syncSettings.domainRules]);

  const handleDragEnd = useCallback((event: Parameters<DragEndEvent>[0]) => {
    if (!event.canceled) {
      const reordered = moveRules(dragItems ?? syncSettings.domainRules, event);
      if (reordered !== (dragItems ?? syncSettings.domainRules)) {
        updateRules(reordered);
      } else if (dragItems) {
        updateRules(dragItems);
      }
    }
    setDragItems(null);
  }, [dragItems, syncSettings.domainRules, updateRules]);

  const listRef = useRef<HTMLDivElement>(null);

  const handleCardKeyDown = useCallback((e: React.KeyboardEvent, rule: DomainRuleSetting, index: number) => {
    const cards = listRef.current?.querySelectorAll<HTMLElement>('[role="row"]');
    if (!cards) return;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        cards[index + 1]?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        cards[index - 1]?.focus();
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
  }, [handleRowSelect, handleEditRule, selectedIds]);

  const handleAddRule = () => {
    setEditingRule(undefined);
    setIsModalOpen(true);
  };

  const handleSubmitRule = (rule: DomainRule) => {
    if (editingRule) {
      const originalRule = syncSettings.domainRules.find(r => r.id === rule.id);
      const updatedRule: DomainRuleSetting = {
        ...rule,
        enabled: originalRule?.enabled ?? true,
        badge: originalRule?.badge,
      };
      updateRules(syncSettings.domainRules.map(r => r.id === rule.id ? updatedRule : r));
    } else {
      const newRule: DomainRuleSetting = { ...rule, id: generateUUID(), enabled: true };
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
          <Box data-testid="page-rules">
            {/* Toolbar: Search + Add (hidden when no rules exist) */}
            {syncSettings.domainRules.length > 0 && (
              <ListToolbar
                testId="page-rules-toolbar"
                searchTestId="page-rules-search"
                searchPlaceholder={getMessage('searchRules')}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                action={
                  <Button data-testid="page-rules-btn-add" onClick={handleAddRule}>
                    <Plus size={16} aria-hidden="true" />
                    {getMessage('addRule')}
                  </Button>
                }
              />
            )}

            {selectedIds.size > 0 && (
              <BulkActionsBar
                selectedIds={selectedIds}
                filteredRules={filteredRules}
                isAllSelected={isAllSelected}
                isIndeterminate={isIndeterminate}
                onSelectAll={handleSelectAll}
                onBulkToggle={handleBulkToggle}
                onBulkDeleteRequest={(ids) => setDeleteTarget({ type: 'bulk', ruleIds: ids })}
              />
            )}

            {filteredRules.length === 0 ? (
              <RulesEmptyState
                hasRules={syncSettings.domainRules.length > 0}
                hasSearch={!!searchTerm}
                onAddRule={handleAddRule}
                onImport={() => setIsImportOpen(true)}
              />
            ) : (
              <DragDropProvider modifiers={[RestrictToVerticalAxis]} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                <Flex data-testid="page-rules-list" direction="column" gap="3" role="grid" aria-label={getMessage('domainRulesTab')} ref={listRef}>
                  {(dragItems ?? filteredRules).map((rule, index) => (
                    <DomainRuleCard
                      key={rule.id}
                      rule={rule}
                      index={index}
                      isSelected={selectedIds.has(rule.id)}
                      searchTerm={searchTerm}
                      isDragDisabled={!!searchTerm}
                      isDomainActionDisabled={getRulesForRootDomain(syncSettings.domainRules, rule.domainFilter).length <= 1}
                      onSelect={handleRowSelect}
                      onToggleEnabled={handleToggleEnabled}
                      onEdit={handleEditRule}
                      onDeleteRequest={(ruleId, focusIndex) => setDeleteTarget({ type: 'single', ruleId, focusIndex })}
                      onMoveToFirst={handleMoveToFirst}
                      onMoveToLast={handleMoveToLast}
                      onMoveToFirstOfDomain={handleMoveToFirstOfDomain}
                      onMoveToLastOfDomain={handleMoveToLastOfDomain}
                      onKeyDown={(e) => handleCardKeyDown(e, rule, index)}
                    />
                  ))}
                </Flex>
              </DragDropProvider>
            )}
          </Box>
        )}
      </PageLayout>

      <RuleWizardModal
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

      <ImportWizard
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        existingRules={syncSettings.domainRules}
        onImport={updateRules}
      />
    </>
  );
}
