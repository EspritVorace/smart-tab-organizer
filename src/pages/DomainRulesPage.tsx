import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Button, Flex, Box, Kbd, Tooltip } from '@radix-ui/themes';
import { Plus, Eye, EyeOff, Shield, AlertCircle, Trash2, FileDown, PackagePlus } from 'lucide-react';
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
import { RuleViewMenu } from '@/components/UI/RuleViewMenu';
import { RuleGroupHeader } from '@/components/Core/DomainRule/RuleGroupHeader';
import { getMessage } from '@/utils/i18n';
import { foldAccents } from '@/utils/stringUtils';
import { generateUUID } from '@/utils/utils';
import { DomainRuleCard } from '@/components/Core/DomainRule/DomainRuleCard';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useListNavigation } from '@/hooks/useListNavigation';
import { useImportExportWizards } from '@/contexts/ImportExportWizardsContext';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext';
import type { RulesPendingAction } from '@/hooks/useDeepLinking';
import {
  moveToFirst,
  moveToLast,
  moveToFirstOfDomain,
  moveToLastOfDomain,
  getRulesForRootDomain,
} from '@/utils/ruleOrderUtils';
import { getOverlapPrecedenceList } from '@/utils/ruleOverlapUtils';
import {
  computeRuleView,
  applySubsetReorder,
  normalizeRuleViewState,
  DEFAULT_RULE_VIEW_STATE,
  type RuleViewState,
} from '@/utils/ruleViewUtils';
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

interface RuleCardListProps {
  rules: DomainRuleSetting[];
  dragDisabled: boolean;
  ariaLabel: string;
  allRules: DomainRuleSetting[];
  selectedIds: Set<string>;
  searchTerm: string;
  overlap: Map<string, DomainRuleSetting[]>;
  navIndexById: Map<string, number>;
  onSelect: (id: string, checked: boolean) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  onEdit: (rule: DomainRuleSetting) => void;
  onDeleteRequest: (ruleId: string) => void;
  onMoveToFirst: (id: string) => void;
  onMoveToLast: (id: string) => void;
  onMoveToFirstOfDomain: (id: string) => void;
  onMoveToLastOfDomain: (id: string) => void;
  onCardKeyDown: (e: React.KeyboardEvent, rule: DomainRuleSetting, navIndex: number) => void;
}

/**
 * Renders one section's rule cards inside an ARIA list. The per-section
 * sortable `index` is the card's position within `rules`; the keyboard
 * navigation index is the card's global DOM position (`navIndexById`).
 */
function RuleCardList(props: RuleCardListProps) {
  return (
    <Flex direction="column" gap="3" role="list" aria-label={props.ariaLabel}>
      {props.rules.map((rule, i) => (
        <DomainRuleCard
          key={rule.id}
          rule={rule}
          index={i}
          isSelected={props.selectedIds.has(rule.id)}
          searchTerm={props.searchTerm}
          isDragDisabled={props.dragDisabled}
          isDomainActionDisabled={
            getRulesForRootDomain(props.allRules, rule.domainFilter).length <= 1
          }
          overlapPrecedenceList={props.overlap.get(rule.id)}
          onSelect={props.onSelect}
          onToggleEnabled={props.onToggleEnabled}
          onEdit={props.onEdit}
          onDeleteRequest={props.onDeleteRequest}
          onMoveToFirst={props.onMoveToFirst}
          onMoveToLast={props.onMoveToLast}
          onMoveToFirstOfDomain={props.onMoveToFirstOfDomain}
          onMoveToLastOfDomain={props.onMoveToLastOfDomain}
          onKeyDown={e => props.onCardKeyDown(e, rule, props.navIndexById.get(rule.id) ?? 0)}
        />
      ))}
    </Flex>
  );
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
  const { scopedItems } = useActiveWorkspaceContext();
  const rulesViewStateItem = scopedItems.rulesViewStateItem;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DomainRule | undefined>(undefined);
  // Transient drag preview scoped to the section (group key, or '__ungrouped__') being dragged.
  const [dragSection, setDragSection] = useState<{ key: string; items: DomainRuleSetting[] } | null>(null);
  const [viewState, setViewState] = useState<RuleViewState>(DEFAULT_RULE_VIEW_STATE);

  useEffect(() => {
    rulesViewStateItem.getValue().then(v => setViewState(normalizeRuleViewState(v)));
  }, [rulesViewStateItem]);

  const handleViewChange = useCallback((next: RuleViewState) => {
    setViewState(next);
    rulesViewStateItem.setValue(next).catch(() => {});
  }, [rulesViewStateItem]);

  useEffect(() => {
    if (!pendingAction) return;
    if (pendingAction === 'create') {
      setEditingRule(undefined);
      setIsModalOpen(true);
    } else if (pendingAction === 'import') {
      openImportRules();
    } else if (pendingAction === 'import-pack') {
      openImportRules({ initialSourceMode: 'pack' });
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

  const searchPredicate = useMemo(() => {
    if (!searchTerm) return undefined;
    const term = foldAccents(searchTerm);
    return (rule: DomainRuleSetting) =>
      foldAccents(rule.label).includes(term) || foldAccents(rule.domainFilter).includes(term);
  }, [searchTerm]);

  const viewResult = useMemo(
    () =>
      computeRuleView(syncSettings.domainRules, viewState, {
        searchPredicate,
        searchActive: searchTerm.length > 0,
      }),
    [syncSettings.domainRules, viewState, searchPredicate, searchTerm],
  );

  const visibleRules = useMemo(
    () => [...viewResult.groups.flatMap(g => g.rules), ...viewResult.ungrouped],
    [viewResult],
  );
  const visibleIds = useMemo(() => visibleRules.map(r => r.id), [visibleRules]);
  // Global DOM position of each visible card, used by keyboard list navigation
  // (independent of the per-group sortable index passed to dnd-kit).
  const navIndexById = useMemo(() => {
    const map = new Map<string, number>();
    visibleRules.forEach((r, i) => map.set(r.id, i));
    return map;
  }, [visibleRules]);

  // Drag-and-drop mutates the real order, so we only allow it for domain
  // auto-groups when the displayed order still maps to the real order
  // (no search, no active filter).
  const filtersActive =
    viewState.filterColors.length > 0 ||
    viewState.filterCategories.length > 0 ||
    viewState.filterStatus.length === 1;
  const domainDndAllowed = !searchTerm && !filtersActive;

  const overlapPrecedenceByRuleId = useMemo(() => {
    const map = new Map<string, DomainRuleSetting[]>();
    for (const r of syncSettings.domainRules) {
      if (!r.enabled) continue;
      const list = getOverlapPrecedenceList(r, syncSettings.domainRules);
      if (list.length > 1) map.set(r.id, list);
    }
    return map;
  }, [syncSettings.domainRules]);

  const handleRowSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? new Set(visibleIds) : new Set());
  }, [visibleIds]);

  const handleSelectGroup = useCallback((ruleIds: string[], checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      for (const id of ruleIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const selectedVisibleCount = visibleIds.filter(id => selectedIds.has(id)).length;
  const isAllSelected = visibleRules.length > 0 && selectedVisibleCount === visibleRules.length;
  const isIndeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleRules.length;

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

  // Per-section drag handlers. `isFullList` is true only for the pristine
  // ungrouped list (drop reorders the whole array); otherwise the dropped
  // subset is woven back into the real array via applySubsetReorder.
  const handleSectionDragOver =
    (sectionKey: string, baseRules: DomainRuleSetting[]) => (event: DragOverEvent) => {
      setDragSection(prev => {
        const base = prev && prev.key === sectionKey ? prev.items : baseRules;
        return { key: sectionKey, items: moveRules(base, event) };
      });
    };

  const handleSectionDragEnd =
    (sectionKey: string, baseRules: DomainRuleSetting[], isFullList: boolean) =>
    (event: DragEndEvent) => {
      setDragSection(prev => {
        if (!event.canceled) {
          const base = prev && prev.key === sectionKey ? prev.items : baseRules;
          const reordered = moveRules(base, event);
          updateRules(
            isFullList ? reordered : applySubsetReorder(syncSettings.domainRules, reordered),
          );
        }
        return null;
      });
    };

  const listRef = useRef<HTMLDivElement>(null);

  const { handleNavigationKey } = useListNavigation(listRef, '[role="listitem"]', {
    autoFocus: { fallbackSelector: '[data-testid="page-rules-btn-import-pack"]' },
  });

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
      'ruleCard.moveToFirst': () => {
        const focused = getFocusedRule();
        if (focused) handleMoveToFirst(focused.rule.id);
      },
      'ruleCard.moveToLast': () => {
        const focused = getFocusedRule();
        if (focused) handleMoveToLast(focused.rule.id);
      },
      'ruleCard.moveToFirstOfDomain': () => {
        const focused = getFocusedRule();
        if (!focused) return;
        if (getRulesForRootDomain(syncSettings.domainRules, focused.rule.domainFilter).length <= 1) return;
        handleMoveToFirstOfDomain(focused.rule.id);
      },
      'ruleCard.moveToLastOfDomain': () => {
        const focused = getFocusedRule();
        if (!focused) return;
        if (getRulesForRootDomain(syncSettings.domainRules, focused.rule.domainFilter).length <= 1) return;
        handleMoveToLastOfDomain(focused.rule.id);
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

  // Resolves the deleted card's position from the live DOM (independent of the
  // per-group sortable index) so keyboard focus moves to a sensible neighbour.
  const requestDelete = useCallback((ruleId: string) => {
    const cards = listRef.current?.querySelectorAll<HTMLElement>('[role="listitem"]');
    let focusIndex: number | undefined;
    cards?.forEach((card, i) => {
      if (card.getAttribute('data-rule-id') === ruleId) focusIndex = i;
    });
    setDeleteTarget({ type: 'single', ruleId, focusIndex });
  }, []);

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

  // Props shared by every RuleCardList section (groups + ungrouped).
  const cardListCommon = {
    allRules: syncSettings.domainRules,
    selectedIds,
    searchTerm,
    overlap: overlapPrecedenceByRuleId,
    navIndexById,
    onSelect: handleRowSelect,
    onToggleEnabled: handleToggleEnabled,
    onEdit: handleEditRule,
    onDeleteRequest: requestDelete,
    onMoveToFirst: handleMoveToFirst,
    onMoveToLast: handleMoveToLast,
    onMoveToFirstOfDomain: handleMoveToFirstOfDomain,
    onMoveToLastOfDomain: handleMoveToLastOfDomain,
    onCardKeyDown: handleCardKeyDown,
  };

  return (
    <>
      <PageLayout
        titleKey="domainRulesTab"
        descriptionKey="domainRulesPageDescription"
        syncSettings={syncSettings}
      >
        {() => (
          <Box
            data-testid="page-rules"
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            {/* Toolbar: Search + Add (hidden when no rules exist) */}
            {syncSettings.domainRules.length > 0 && (
              <ListToolbar
                testId="page-rules-toolbar"
                searchTestId="page-rules-search"
                searchPlaceholder={getMessage('searchRules')}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                filter={
                  <RuleViewMenu
                    value={viewState}
                    onChange={handleViewChange}
                    testId="page-rules-btn-view"
                  />
                }
                action={
                  <Tooltip content={<Flex align="center" gap="2" aria-hidden="true">{getMessage('addRule')}<Kbd>N</Kbd></Flex>}>
                    <Button data-testid="page-rules-btn-add" onClick={handleAddRule} aria-keyshortcuts="N">
                      <Plus size={16} />
                      {getMessage('addRule')}
                    </Button>
                  </Tooltip>
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
                <Button size="1" variant="ghost" onClick={() => handleBulkToggle(Array.from(selectedIds), true)}>
                  <Eye size={14} />
                  {getMessage('enableSelected')}
                </Button>
                <Button size="1" variant="ghost" onClick={() => handleBulkToggle(Array.from(selectedIds), false)}>
                  <EyeOff size={14} />
                  {getMessage('disableSelected')}
                </Button>
                <Button
                  size="1"
                  variant="ghost"
                  data-testid="page-rules-bulk-btn-export"
                  onClick={() => setBulkExportIds(Array.from(selectedIds))}
                >
                  <FileDown size={14} />
                  {getMessage('exportSelected')}
                </Button>
                <Button
                  size="1"
                  variant="ghost"
                  color="red"
                  onClick={() => setDeleteTarget({ type: 'bulk', ruleIds: Array.from(selectedIds) })}
                >
                  <Trash2 size={14} />
                  {getMessage('deleteSelected')}
                </Button>
              </BulkActionsBar>
            )}

            <Box
              data-testid="page-rules-scroll"
              style={{ flex: 1, overflow: 'auto', minHeight: 0 }}
            >
              {syncSettings.domainRules.length === 0 && !searchTerm && (
                <EmptyState
                  data-testid="page-rules-empty"
                  icon={Shield}
                  title={getMessage('rulesEmptyTitle')}
                  description={getMessage('rulesEmptyDescription')}
                  actions={
                    <Flex gap="2">
                      <Button
                        data-testid="page-rules-btn-import-pack"
                        variant="solid"
                        onClick={() => openImportRules({ initialSourceMode: 'pack' })}
                      >
                        <PackagePlus size={14} />
                        {getMessage('rulesEmptyImportPack')}
                      </Button>
                      <Button data-testid="page-rules-btn-add" variant="outline" onClick={handleAddRule}>
                        <Plus size={14} />
                        {getMessage('addRule')}
                      </Button>
                    </Flex>
                  }
                />
              )}
              {viewResult.visibleCount === 0 && (syncSettings.domainRules.length > 0 || searchTerm) && (
                <EmptyState compact icon={AlertCircle} message={getMessage('noRulesFound')} />
              )}
              {viewResult.visibleCount > 0 && (
                <Flex data-testid="page-rules-list" direction="column" gap="2" ref={listRef}>
                  {viewResult.groups.map(group => {
                    const dndEnabled = group.isDndEnabled && domainDndAllowed;
                    const displayRules =
                      dragSection?.key === group.key ? dragSection.items : group.rules;
                    return (
                      <Box key={group.key}>
                        <RuleGroupHeader
                          group={group}
                          testId={`page-rules-group-${group.key}`}
                          selectedCount={group.ruleIds.filter(id => selectedIds.has(id)).length}
                          onSelectGroup={handleSelectGroup}
                        />
                        <DragDropProvider
                          modifiers={[RestrictToVerticalAxis]}
                          onDragOver={dndEnabled ? handleSectionDragOver(group.key, group.rules) : undefined}
                          onDragEnd={dndEnabled ? handleSectionDragEnd(group.key, group.rules, false) : undefined}
                        >
                          <RuleCardList
                            {...cardListCommon}
                            rules={displayRules}
                            dragDisabled={!dndEnabled}
                            ariaLabel={group.label}
                          />
                        </DragDropProvider>
                      </Box>
                    );
                  })}
                  {viewResult.ungrouped.length > 0 && (
                    <DragDropProvider
                      modifiers={[RestrictToVerticalAxis]}
                      onDragOver={
                        viewResult.isUngroupedDndEnabled
                          ? handleSectionDragOver('__ungrouped__', viewResult.ungrouped)
                          : undefined
                      }
                      onDragEnd={
                        viewResult.isUngroupedDndEnabled
                          ? handleSectionDragEnd('__ungrouped__', viewResult.ungrouped, true)
                          : undefined
                      }
                    >
                      <RuleCardList
                        {...cardListCommon}
                        rules={
                          dragSection?.key === '__ungrouped__'
                            ? dragSection.items
                            : viewResult.ungrouped
                        }
                        dragDisabled={!viewResult.isUngroupedDndEnabled}
                        ariaLabel={getMessage('domainRulesTab')}
                      />
                    </DragDropProvider>
                  )}
                </Flex>
              )}
            </Box>
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
