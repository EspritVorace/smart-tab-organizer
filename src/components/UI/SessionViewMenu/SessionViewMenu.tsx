import { DropdownMenu, Flex } from '@radix-ui/themes';
import { RotateCcw } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import type { RuleCategory } from '@/schemas/category';
import { ViewMenuTrigger } from '@/components/UI/ViewMenuTrigger/ViewMenuTrigger';
import { CategoryFilterSubMenu } from '@/components/UI/CategoryFilterSubMenu/CategoryFilterSubMenu';
import {
  DEFAULT_SESSION_VIEW_STATE,
  countActiveSessionViewOps,
  type SessionSortDirection,
  type SessionSortMode,
  type SessionViewState,
} from '@/utils/sessionViewUtils';

export interface SessionViewMenuProps {
  value: SessionViewState;
  onChange: (next: SessionViewState) => void;
  /** Categories used to populate the category filter sub-menu. Defaults to the built-in set. */
  categories?: RuleCategory[];
  /** Prefix for the `data-testid` attributes (e.g. `page-sessions-view-unpinned`). */
  testIdPrefix?: string;
}

/** Adds or removes a value from an array, preserving order, no duplicates. */
function toggleInArray<T>(arr: readonly T[], item: T, checked: boolean): T[] {
  if (checked) return arr.includes(item) ? [...arr] : [...arr, item];
  return arr.filter(v => v !== item);
}

/**
 * Filter / sort menu rendered on the right of a session section header.
 * Mirrors `RuleViewMenu` but simplified for sessions (category filter; sort by
 * date, last restore, category or manual; no color/status/grouping).
 */
export function SessionViewMenu({
  value,
  onChange,
  categories,
  testIdPrefix = 'page-sessions-view',
}: SessionViewMenuProps) {
  const activeOps = countActiveSessionViewOps(value);

  const setCategory = (id: string, checked: boolean) =>
    onChange({ ...value, filterCategories: toggleInArray(value.filterCategories, id, checked) });

  const setSort = (sort: SessionSortMode) => onChange({ ...value, sort });
  const setDirection = (sortDirection: SessionSortDirection) =>
    onChange({ ...value, sortDirection });
  const reset = () => onChange({ ...DEFAULT_SESSION_VIEW_STATE });

  // Keep the menu open when toggling filters / radio items.
  const keepOpen = (event: Event) => event.preventDefault();

  return (
    <DropdownMenu.Root>
      <ViewMenuTrigger
        activeOps={activeOps}
        label={getMessage('sessionViewMenu')}
        activeLabel={getMessage('sessionViewMenuActive')}
        testId={`${testIdPrefix}-btn`}
        size="1"
      />

      <DropdownMenu.Content>
        {/* ── Filter ── */}
        <DropdownMenu.Label>{getMessage('sessionViewFilterLabel')}</DropdownMenu.Label>
        <CategoryFilterSubMenu
          selected={value.filterCategories}
          onToggle={setCategory}
          testIdPrefix={testIdPrefix}
          subLabel={getMessage('sessionViewFilterByCategory')}
          noneLabel={getMessage('sessionViewNoCategory')}
          categories={categories}
        />

        <DropdownMenu.Separator />

        {/* ── Sort ── */}
        <DropdownMenu.Label>{getMessage('sessionViewSortLabel')}</DropdownMenu.Label>
        <DropdownMenu.RadioGroup value={value.sort} onValueChange={v => setSort(v as SessionSortMode)}>
          <DropdownMenu.RadioItem value="manual" data-testid={`${testIdPrefix}-sort-manual`} onSelect={keepOpen}>
            {getMessage('sessionViewSortManual')}
          </DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="date" data-testid={`${testIdPrefix}-sort-date`} onSelect={keepOpen}>
            {getMessage('sessionViewSortDate')}
          </DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="restored" data-testid={`${testIdPrefix}-sort-restored`} onSelect={keepOpen}>
            {getMessage('sessionViewSortRestored')}
          </DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="category" data-testid={`${testIdPrefix}-sort-category`} onSelect={keepOpen}>
            {getMessage('sessionViewSortCategory')}
          </DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>

        {value.sort !== 'manual' && (
          <>
            <DropdownMenu.Label>{getMessage('sessionViewSortDirectionLabel')}</DropdownMenu.Label>
            <DropdownMenu.RadioGroup
              value={value.sortDirection}
              onValueChange={v => setDirection(v as SessionSortDirection)}
            >
              <DropdownMenu.RadioItem value="asc" data-testid={`${testIdPrefix}-dir-asc`} onSelect={keepOpen}>
                {getMessage('sessionViewSortAscending')}
              </DropdownMenu.RadioItem>
              <DropdownMenu.RadioItem value="desc" data-testid={`${testIdPrefix}-dir-desc`} onSelect={keepOpen}>
                {getMessage('sessionViewSortDescending')}
              </DropdownMenu.RadioItem>
            </DropdownMenu.RadioGroup>
          </>
        )}

        {activeOps > 0 && (
          <>
            <DropdownMenu.Separator />
            <DropdownMenu.Item data-testid={`${testIdPrefix}-reset`} onSelect={reset}>
              <Flex align="center" gap="2">
                <RotateCcw size={14} aria-hidden="true" />
                {getMessage('sessionViewResetLabel')}
              </Flex>
            </DropdownMenu.Item>
          </>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
