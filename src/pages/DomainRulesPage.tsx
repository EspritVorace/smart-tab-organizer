import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Button, Flex, Box } from '@radix-ui/themes';
import { Plus, Eye, EyeOff, Shield, AlertCircle, Upload, Trash2, FileDown } from 'lucide-react';
import { DragDropProvider, type DragEndEvent, type DragOverEvent } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { PageLayout } from '@/components/UI/PageLayout/PageLayout';
import { EmptyState } from '@/components/UI/EmptyState';
import { RuleWizardModal } from '@/components/Core/DomainRule/RuleWizardModal';
import { ExportWizard } from '@/components/UI/ImportExportWizards/ExportWizard';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog/ConfirmDialog';
import { ListToolbar } from '@/components/UI/ListToolbar';
import { BulkActionsBar } from '@/components/UI/BulkActionsBar';
import { getMessage } from '@/utils/i18n';
import { foldAccents } from '@/utils/stringUtils';
import { generateUUID } from '@/utils/utils';
import { DomainRuleCard } from '@/components/Core/DomainRule/DomainRuleCard';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useListNavigation } from '@/hooks/useListNavigation';
import { useImportExportWizards } from '@/contexts/ImportExportWizardsContext';
import type { RulesPendingAction } from '@/hooks/useDeepLinking';
import {
  moveToFirst,
  moveToLast,
  moveToFirstOfDomain,
  moveToLastOfDomain,
  getRulesForRootDomain,
} from '@/utils/ruleOrderUtils';
import type { AppSettings, DomainRuleSetting } from '@/types/syncSettings';
import type { DomainRule } from '@/schemas/domainRule';

type DeleteTarget =
  | { type: 'single'; ruleId: string; focusIndex?: number }
  | { type: 'bulk'; ruleIds: string[] };

function stripUiOnlyFields(rule: DomainRuleSetting): DomainRule {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { enabled, badge, ...domainRule } = rule;
  return domainRule;
}

function confirmDeleteDescription(
  target: DeleteTarget | null,
  domainRules: DomainRuleSetting[],
): string {
  if (target?.type === 'bulk') return getMessage('confirmDeleteSelectedDescription');
  const ruleLabel = target?.type === 'single'
    ? domainRules.find(r => r.id === target.ruleId)?.label ?? ''
    : '';
  return getMessage('confirmDeleteDescription').replace('{item}', ruleLabel);
}

interface DomainRulesPageProps {
  syncSettings: AppSettings;
  updateRules: (rules: DomainRuleSetting[]) => void;
  /** Deep-link action to consume on mount (e.g. open the create or import wizard). */
  pendingAction?: RulesPendingAction | null;
  /** Called once the pending action has been consumed so the parent can clear it. */
  onPendingActionConsumed?: () => void;
}

/* ─── Page component ──────────────────────────────────────────────────────── */

export function DomainRulesPage({
  syncSettings,
  updateRules,
  pendingAction,
  onPendingActionConsumed,
}: DomainRulesPageProps) {
  const { openImportRules } = useImportExportWizards();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DomainRule | undefined>(undefined);
  const [dragItems, setDragItems] = useState<DomainRuleSetting[] | null>(null);

  useEffect(() => {
    if (!pendingAction) return;
    if (pendingAction === 'create') {
      setEditingRule(undefined);
      setIsModalOpen(true);
    } else if (pendingAction === 'import') {
      openImportRules();
    }
    onPendingActionConsumed?.();
  }, [pendingAction, openImportRules, onPendingActionConsumed]);

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
  const [bulkExportIds, setBulkExportIds] = useState<string[] | null>(null);
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
    setEditingRule(stripUiOnlyFields(rule));
    setIsModalOpen(true);
  }, []);

  // @dnd-kit/helpers' move() is typed as `Items | Record<UniqueIdentifier, Items>`
  // where `Items = UniqueIdentifier[] | { id: UniqueIdentifier }[]`. The union
  // confuses TS inference even though DomainRuleSetting[] is structurally
  // compatible (each rule has `id: string`). Wrap once with the necessary
  // unknown-cast and rely on the helper for the rest.
  const moveRules = (
    rules: DomainRuleSetting[],
    event: DragOverEvent | DragEndEvent,
  ): DomainRuleSetting[] =>
    (move as unknown as (
      r: DomainRuleSetting[],
      e: typeof event,
    ) => DomainRuleSetting[])(rules, event);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setDragItems(prev => moveRules(prev ?? syncSettings.domainRules, event));
  }, [syncSettings.domainRules]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
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

  const { handleNavigationKey } = useListNavigation(listRef, '[role="listitem"]');

  // The card keydown handler now only forwards arrow/Home/End to
  // useListNavigation. The Enter binding is kept here because Enter to
  // open the editor is a card-local interaction that is not in the registry
  // (the registry exposes `e` for editing, surfaced via widget shortcuts
  // below). All other key actions (e, t, Space, Delete) are dispatched at
  // document level via `useShortcuts({...}, { scope: 'widget:rule-card' })`.
  const handleCardKeyDown = useCallback((e: React.KeyboardEvent, rule: DomainRuleSetting, index: number) => {
    if (e.target !== e.currentTarget) return;
    if (handleNavigationKey(e as React.KeyboardEvent<HTMLElement>, index)) return;
    if (e.key === 'Enter' && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      handleEditRule(rule);
    }
  }, [handleNavigationKey, handleEditRule]);

  const handleAddRule = useCallback(() => {
    setEditingRule(undefined);
    setIsModalOpen(true);
  }, []);

  const getFocusedRule = useCallback((): { rule: DomainRuleSetting; index: number } | null => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) return null;
    if (!active.matches('[data-shortcut-scope="widget:rule-card"]')) return null;
    const id = active.getAttribute('data-rule-id');
    if (!id) return null;
    const cards = listRef.current?.querySelectorAll<HTMLElement>('[role="listitem"]');
    let index = -1;
    if (cards) {
      cards.forEach((card, i) => {
        if (card === active) index = i;
      });
    }
    const rule = syncSettings.domainRules.find((r) => r.id === id);
    return rule ? { rule, index } : null;
  }, [syncSettings.domainRules]);

  useShortcuts({ 'list.rules.new': handleAddRule }, { scope: 'page:rules' });

  useShortcuts(
    {
      'ruleCard.edit': () => {
        const focused = getFocusedRule();
        if (focused) handleEditRule(focused.rule);
      },
      'ruleCard.toggleEnabled': () => {
        const focused = getFocusedRule();
        if (focused) handleToggleEnabled(focused.rule.id, !focused.rule.enabled);
      },
      'ruleCard.toggleSelection': () => {
        const focused = getFocusedRule();
        if (focused) handleRowSelect(focused.rule.id, !selectedIds.has(focused.rule.id));
      },
      'ruleCard.delete': () => {
        const focused = getFocusedRule();
        if (focused) {
          setDeleteTarget({
            type: 'single',
            ruleId: focused.rule.id,
            focusIndex: focused.index >= 0 ? focused.index : undefined,
          });
        }
      },
    },
    { scope: 'widget:rule-card' },
  );

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
        const cards = listRef.current?.querySelectorAll<HTMLElement>('[role="listitem"]');
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
        descriptionKey="domainRulesPageDescription"
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
                    <Plus size={16} />
                    {getMessage('addRule')}
                  </Button>
                }
              />
            )}

            {selectedIds.size > 0 && (
              <BulkActionsBar
                testId="page-rules-bulk-bar"
                selectedCount={selectedIds.size}
                isAllSelected={isAllSelected}
                isIndeterminate={isIndeterminate}
                onSelectAll={handleSelectAll}
              >
                <Button size="1" variant="solid" onClick={() => handleBulkToggle(Array.from(selectedIds), true)}>
                  <Eye size={14} />
                  {getMessage('enableSelected')}
                </Button>
                <Button size="1" variant="soft" onClick={() => handleBulkToggle(Array.from(selectedIds), false)}>
                  <EyeOff size={14} />
                  {getMessage('disableSelected')}
                </Button>
                <Button
                  size="1"
                  variant="soft"
                  data-testid="page-rules-bulk-btn-export"
                  onClick={() => setBulkExportIds(Array.from(selectedIds))}
                >
                  <FileDown size={14} />
                  {getMessage('exportSelected')}
                </Button>
                <Button
                  size="1"
                  variant="solid"
                  color="red"
                  highContrast
                  onClick={() => setDeleteTarget({ type: 'bulk', ruleIds: Array.from(selectedIds) })}
                >
                  <Trash2 size={14} />
                  {getMessage('deleteSelected')}
                </Button>
              </BulkActionsBar>
            )}

            {filteredRules.length === 0 && syncSettings.domainRules.length === 0 && !searchTerm && (
              <EmptyState
                data-testid="page-rules-empty"
                icon={Shield}
                title={getMessage('rulesEmptyTitle')}
                description={getMessage('rulesEmptyDescription')}
                actions={
                  <Flex gap="2">
                    <Button data-testid="page-rules-btn-add" variant="soft" onClick={handleAddRule}>
                      <Plus size={14} />
                      {getMessage('addRule')}
                    </Button>
                    <Button variant="soft" onClick={() => openImportRules()}>
                      <Upload size={14} />
                      {getMessage('importRulesButton')}
                    </Button>
                  </Flex>
                }
              />
            )}
            {filteredRules.length === 0 && (syncSettings.domainRules.length > 0 || searchTerm) && (
              <EmptyState compact icon={AlertCircle} message={getMessage('noRulesFound')} />
            )}
            {filteredRules.length > 0 && (
              <DragDropProvider modifiers={[RestrictToVerticalAxis]} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                <Flex data-testid="page-rules-list" direction="column" gap="3" role="list" aria-label={getMessage('domainRulesTab')} ref={listRef}>
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
        description={confirmDeleteDescription(deleteTarget, syncSettings.domainRules)}
      />

      <ExportWizard
        open={bulkExportIds != null}
        onOpenChange={(open) => { if (!open) setBulkExportIds(null); }}
        rules={syncSettings.domainRules}
        initialSelectedIds={bulkExportIds ?? undefined}
      />

    </>
  );
}
