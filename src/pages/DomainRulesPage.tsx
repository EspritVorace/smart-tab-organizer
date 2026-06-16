import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Button, Flex, Box, Kbd, Tooltip, Separator } from '@radix-ui/themes';
import { Plus, Eye, EyeOff, Shield, AlertCircle, Trash2, FileDown, PackagePlus, Download, Upload } from 'lucide-react';
import { DragDropProvider, type DragEndEvent, type DragOverEvent } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import * as Collapsible from '@radix-ui/react-collapsible';
import { PageLayout } from '@/components/UI/PageLayout/PageLayout';
import { EmptyState } from '@/components/UI/EmptyState';
import { RuleWizardModal } from '@/components/Core/DomainRule/RuleWizardModal';
import { ExportWizard } from '@/components/UI/ImportExportWizards/ExportWizard';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog/ConfirmDialog';
import { ListToolbar, ListToolbarMenu } from '@/components/UI/ListToolbar';
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
import { markDiscovered } from '@/exploration/progressStore';
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
  type RuleViewGroup,
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
  /** Indents the cards to the right to mark them as children of a group header (mirrors the session sections). */
  indent?: boolean;
  /** Key of the group these cards belong to (omitted for the ungrouped section). Lets a focused card collapse its parent group with ArrowLeft. */
  groupKey?: string;
  allRules: DomainRuleSetting[];
  selectedIds: Set<string>;
  searchTerm: string;
  overlap: Map<string, DomainRuleSetting[]>;
  onSelect: (id: string, checked: boolean) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  onEdit: (rule: DomainRuleSetting) => void;
  onDeleteRequest: (ruleId: string) => void;
  onMoveToFirst: (id: string) => void;
  onMoveToLast: (id: string) => void;
  onMoveToFirstOfDomain: (id: string) => void;
  onMoveToLastOfDomain: (id: string) => void;
  onCardKeyDown: (e: React.KeyboardEvent, rule: DomainRuleSetting, groupKey?: string) => void;
}

/**
 * Renders one section's rule cards inside an ARIA list. The per-section
 * sortable `index` is the card's position within `rules`; the keyboard
 * navigation index is resolved live from the DOM by the page handler
 * (`[data-rules-nav-item]` order), so collapsed groups never desync it.
 */
function RuleCardList(props: RuleCardListProps) {
  return (
    <Flex
      direction="column"
      gap="3"
      role="list"
      aria-label={props.ariaLabel}
      pl={props.indent ? '6' : undefined}
    >
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
          onKeyDown={e => props.onCardKeyDown(e, rule, props.groupKey)}
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
  const { openImportRules, openExportRules } = useImportExportWizards();
  const { scopedItems } = useActiveWorkspaceContext();
  const rulesViewStateItem = scopedItems.rulesViewStateItem;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DomainRule | undefined>(undefined);
  // Transient drag preview scoped to the section (group key, or '__ungrouped__') being dragged.
  const [dragSection, setDragSection] = useState<{ key: string; items: DomainRuleSetting[] } | null>(null);
  const [viewState, setViewState] = useState<RuleViewState>(DEFAULT_RULE_VIEW_STATE);
  // The persisted view state loads asynchronously; gate the initial list focus
  // on it so autofocus targets the first rule of the *actual* (sorted/filtered/
  // grouped) list rather than the transient default render.
  const [viewLoaded, setViewLoaded] = useState(false);

  useEffect(() => {
    rulesViewStateItem.getValue().then(v => {
      setViewState(normalizeRuleViewState(v));
      setViewLoaded(true);
    });
  }, [rulesViewStateItem]);

  const handleViewChange = useCallback((next: RuleViewState) => {
    void markDiscovered('grouping.view.filterSort');
    setViewState(next);
    rulesViewStateItem.setValue(next).catch(() => {});
  }, [rulesViewStateItem]);

  const collapsedGroups = useMemo(
    () => new Set(viewState.collapsedGroups),
    [viewState.collapsedGroups],
  );

  const handleToggleGroupCollapsed = useCallback((key: string, collapsed: boolean) => {
    const next = new Set(viewState.collapsedGroups);
    if (collapsed) {
      next.add(key);
    } else {
      next.delete(key);
    }
    handleViewChange({ ...viewState, collapsedGroups: [...next] });
  }, [viewState, handleViewChange]);

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
    void markDiscovered('grouping.toggle');
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
  // While a search is active, every group is force-expanded so a match never
  // hides inside a collapsed group. The persisted `collapsedGroups` is left
  // untouched and restored when the search clears; collapse toggles are no-ops
  // meanwhile.
  const searchActive = searchTerm.length > 0;
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

  // DOM render order: isolated (ungrouped) rules first, then the domain groups.
  // Drives the "select all visible" set. Keyboard navigation no longer reads a
  // precomputed index from here: it resolves the focused element's position
  // live from the DOM (`[data-rules-nav-item]`), which stays correct even when
  // a collapsed group unmounts its cards.
  const visibleRules = useMemo(
    () => [...viewResult.ungrouped, ...viewResult.groups.flatMap(g => g.rules)],
    [viewResult],
  );
  const visibleIds = useMemo(() => visibleRules.map(r => r.id), [visibleRules]);

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
    void markDiscovered('grouping.edit');
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
      // Read the live preview from the closure (refreshed each render by the
      // onDragOver updates), NOT from inside a setState updater: calling
      // updateRules there would be a side effect during React's update phase
      // and the parent state change would be dropped.
      if (!event.canceled) {
        void markDiscovered('grouping.reorder.drag');
        const base =
          dragSection && dragSection.key === sectionKey ? dragSection.items : baseRules;
        const reordered = moveRules(base, event);
        updateRules(
          isFullList ? reordered : applySubsetReorder(syncSettings.domainRules, reordered),
        );
      }
      setDragSection(null);
    };

  const listRef = useRef<HTMLDivElement>(null);

  // Group headers and rule cards share one vertical navigation sequence, both
  // tagged `[data-rules-nav-item]`. Up/Down/Home/End flow through the whole
  // tree; a collapsed group simply unmounts its cards, so they drop out of the
  // live query.
  const NAV_ITEM_SELECTOR = '[data-rules-nav-item]';
  const { handleNavigationKey } = useListNavigation(listRef, NAV_ITEM_SELECTOR, {
    autoFocus: { ready: viewLoaded, fallbackSelector: '[data-testid="page-rules-btn-import-pack"]' },
  });

  // Live DOM position of a nav item (header or card) among its siblings. Read at
  // event time so collapsing/expanding a group never desyncs the index.
  const navIndexOf = useCallback((el: HTMLElement): number => {
    const items = listRef.current?.querySelectorAll<HTMLElement>(NAV_ITEM_SELECTOR);
    if (!items) return -1;
    return Array.prototype.indexOf.call(items, el);
  }, []);

  // After a filter/sort/group change (view menu close), move focus to the first
  // resulting nav item (group header or rule) so a keyboard/screen-reader user
  // lands on the first visible result. Deferred so it runs after Radix restores
  // focus to the menu trigger.
  const focusFirstRule = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLElement>(NAV_ITEM_SELECTOR)?.focus();
    });
  }, []);

  // Enter in the search field jumps to the first result card (a rule, not a
  // group header), or keeps focus in the field when there is no result.
  const focusFirstResultCard = useCallback(() => {
    listRef.current?.querySelector<HTMLElement>('[role="listitem"]')?.focus();
  }, []);

  // The card keydown handler only forwards arrow/Home/End to useListNavigation
  // (index resolved live from the DOM). The Enter binding is kept here because
  // Enter to open the editor is a card-local interaction that is not in the
  // registry (the registry exposes `e` for editing, surfaced via widget
  // shortcuts below). All other key actions (e, t, Space, Delete) are
  // dispatched at document level via `useShortcuts({...}, { scope: 'widget:rule-card' })`.
  const handleCardKeyDown = useCallback((e: React.KeyboardEvent, rule: DomainRuleSetting, groupKey?: string) => {
    if (e.target !== e.currentTarget) return;
    if (handleNavigationKey(e as React.KeyboardEvent<HTMLElement>, navIndexOf(e.currentTarget as HTMLElement))) return;
    // ArrowLeft on a grouped card collapses its parent group (tree behaviour).
    // The card unmounts on collapse, so move focus up to the group header.
    // Disabled during a search (groups stay force-expanded then).
    if (e.key === 'ArrowLeft' && groupKey) {
      e.preventDefault();
      if (!searchActive && !collapsedGroups.has(groupKey)) {
        handleToggleGroupCollapsed(groupKey, true);
        requestAnimationFrame(() => {
          listRef.current
            ?.querySelector<HTMLElement>(`[data-testid="page-rules-group-${groupKey}-toggle"]`)
            ?.focus();
        });
      }
      return;
    }
    if (e.key === 'Enter' && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      handleEditRule(rule);
    }
  }, [handleNavigationKey, navIndexOf, searchActive, collapsedGroups, handleToggleGroupCollapsed, handleEditRule]);

  // Keyboard handler for a group header's toggle button. Up/Down/Home/End reuse
  // the shared list navigation; Right expands, Left collapses, Space toggles the
  // whole group's selection (preventDefault stops the native button click that
  // would otherwise toggle the Collapsible).
  const handleGroupHeaderKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, group: RuleViewGroup) => {
      if (e.target !== e.currentTarget) return;
      if (handleNavigationKey(e as React.KeyboardEvent<HTMLElement>, navIndexOf(e.currentTarget))) return;
      const isCollapsed = collapsedGroups.has(group.key);
      // preventDefault unconditionally on Left/Right so the page never
      // horizontally scrolls, even when the toggle is a no-op (group already in
      // the target state, or a search forcing every group open).
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (!searchActive && isCollapsed) handleToggleGroupCollapsed(group.key, false);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!searchActive && !isCollapsed) handleToggleGroupCollapsed(group.key, true);
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        const selected = group.ruleIds.filter(id => selectedIds.has(id)).length;
        handleSelectGroup(group.ruleIds, selected < group.ruleIds.length);
      }
      // Enter falls through to Radix Collapsible.Trigger (toggles collapse).
    },
    [handleNavigationKey, navIndexOf, searchActive, collapsedGroups, handleToggleGroupCollapsed, selectedIds, handleSelectGroup],
  );

  const handleAddRule = useCallback(() => {
    void markDiscovered('grouping.create');
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
        if (focused) { void markDiscovered('grouping.reorder.keyboard'); handleMoveToFirst(focused.rule.id); }
      },
      'ruleCard.moveToLast': () => {
        const focused = getFocusedRule();
        if (focused) { void markDiscovered('grouping.reorder.keyboard'); handleMoveToLast(focused.rule.id); }
      },
      'ruleCard.moveToFirstOfDomain': () => {
        const focused = getFocusedRule();
        if (!focused) return;
        if (getRulesForRootDomain(syncSettings.domainRules, focused.rule.domainFilter).length <= 1) return;
        void markDiscovered('grouping.reorder.keyboard');
        handleMoveToFirstOfDomain(focused.rule.id);
      },
      'ruleCard.moveToLastOfDomain': () => {
        const focused = getFocusedRule();
        if (!focused) return;
        if (getRulesForRootDomain(syncSettings.domainRules, focused.rule.domainFilter).length <= 1) return;
        void markDiscovered('grouping.reorder.keyboard');
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
                onSearchSubmit={focusFirstResultCard}
                onSearchChange={setSearchTerm}
                filter={
                  <RuleViewMenu
                    value={viewState}
                    onChange={handleViewChange}
                    onApplied={focusFirstRule}
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
                menu={
                  <ListToolbarMenu
                    testId="page-rules-toolbar-menu"
                    items={[
                      {
                        key: 'export',
                        testId: 'page-rules-toolbar-menu-export',
                        icon: Download,
                        label: getMessage('exportRulesTitle'),
                        onSelect: () => openExportRules(),
                      },
                      {
                        key: 'import',
                        testId: 'page-rules-toolbar-menu-import',
                        icon: Upload,
                        label: getMessage('importRulesTitle'),
                        onSelect: () => openImportRules(),
                      },
                    ]}
                  />
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
                  {/* Isolated rules (ungrouped / single-domain) render first. */}
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

                  {/* Separator between the isolated rules and the domain groups. */}
                  {viewResult.ungrouped.length > 0 && viewResult.groups.length > 0 && (
                    <Separator size="4" my="2" data-testid="page-rules-groups-separator" />
                  )}

                  {viewResult.groups.map(group => {
                    const dndEnabled = group.isDndEnabled && domainDndAllowed;
                    const displayRules =
                      dragSection?.key === group.key ? dragSection.items : group.rules;
                    // A search forces every group open (a match must never hide
                    // in a collapsed group); the persisted state is preserved.
                    const isCollapsed = !searchActive && collapsedGroups.has(group.key);
                    return (
                      <Collapsible.Root
                        key={group.key}
                        open={!isCollapsed}
                        onOpenChange={open => { if (!searchActive) handleToggleGroupCollapsed(group.key, !open); }}
                      >
                        <RuleGroupHeader
                          group={group}
                          collapsed={isCollapsed}
                          testId={`page-rules-group-${group.key}`}
                          selectedCount={group.ruleIds.filter(id => selectedIds.has(id)).length}
                          onSelectGroup={handleSelectGroup}
                          onKeyDown={e => handleGroupHeaderKeyDown(e, group)}
                        />
                        <Collapsible.Content>
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
                              indent
                              groupKey={group.key}
                            />
                          </DragDropProvider>
                        </Collapsible.Content>
                      </Collapsible.Root>
                    );
                  })}
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
