import { Box, DropdownMenu, Flex } from '@radix-ui/themes';
import { RotateCcw } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { getRadixColor } from '@/utils/utils';
import { colorOptions, type ColorValue } from '@/schemas/enums';
import type { RuleCategory } from '@/schemas/category';
import { ViewMenuTrigger } from '@/components/UI/ViewMenuTrigger/ViewMenuTrigger';
import { CategoryFilterSubMenu } from '@/components/UI/CategoryFilterSubMenu/CategoryFilterSubMenu';
import {
  DEFAULT_RULE_VIEW_STATE,
  countActiveViewOps,
  type RuleGroupMode,
  type RuleSortDirection,
  type RuleSortMode,
  type RuleStatusFilter,
  type RuleViewState,
} from '@/utils/ruleViewUtils';

const NONE = '__none__';

export interface RuleViewMenuProps {
  value: RuleViewState;
  onChange: (next: RuleViewState) => void;
  /** Categories used to populate the category filter sub-menu. Defaults to the built-in set. */
  categories?: RuleCategory[];
  testId?: string;
}

/** Adds or removes a value from an array, preserving order, no duplicates. */
function toggleInArray<T>(arr: readonly T[], item: T, checked: boolean): T[] {
  if (checked) return arr.includes(item) ? [...arr] : [...arr, item];
  return arr.filter(v => v !== item);
}

/** Small color swatch reused inside the color filter items. */
function ColorSwatch({ color }: { color: ColorValue }) {
  return (
    <Box
      aria-hidden="true"
      style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        flexShrink: 0,
        backgroundColor: `var(--${getRadixColor(color)}-9)`,
      }}
    />
  );
}

export function RuleViewMenu({ value, onChange, categories, testId }: RuleViewMenuProps) {
  const activeOps = countActiveViewOps(value);
  const isActive = activeOps > 0;

  const setColor = (color: ColorValue | '__none__', checked: boolean) =>
    onChange({ ...value, filterColors: toggleInArray(value.filterColors, color, checked) });

  const setCategory = (id: string, checked: boolean) =>
    onChange({ ...value, filterCategories: toggleInArray(value.filterCategories, id, checked) });

  const setStatus = (status: RuleStatusFilter, checked: boolean) =>
    onChange({ ...value, filterStatus: toggleInArray(value.filterStatus, status, checked) });

  const setSort = (sort: RuleSortMode) => onChange({ ...value, sort });
  const setDirection = (sortDirection: RuleSortDirection) => onChange({ ...value, sortDirection });
  const setGroup = (group: RuleGroupMode) => onChange({ ...value, group });
  const reset = () => onChange({ ...DEFAULT_RULE_VIEW_STATE });

  // Keep the menu open when toggling filters / radio items.
  const keepOpen = (event: Event) => event.preventDefault();

  return (
    <DropdownMenu.Root>
      <ViewMenuTrigger
        activeOps={activeOps}
        label={getMessage('ruleViewMenu')}
        activeLabel={getMessage('ruleViewMenuActive')}
        testId={testId}
      />

      <DropdownMenu.Content>
        {/* ── Filter ── */}
        <DropdownMenu.Label>{getMessage('ruleViewFilterLabel')}</DropdownMenu.Label>

        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger data-testid="page-rules-view-sub-color">
            {getMessage('ruleViewFilterByColor')}
          </DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            {colorOptions.map(option => (
              <DropdownMenu.CheckboxItem
                key={option.value}
                data-testid={`page-rules-view-color-${option.value}`}
                checked={value.filterColors.includes(option.value)}
                onCheckedChange={checked => setColor(option.value, checked)}
                onSelect={keepOpen}
              >
                <Flex align="center" gap="2">
                  <ColorSwatch color={option.value} />
                  {getMessage(option.keyLabel)}
                </Flex>
              </DropdownMenu.CheckboxItem>
            ))}
            <DropdownMenu.CheckboxItem
              data-testid="page-rules-view-color-none"
              checked={value.filterColors.includes(NONE)}
              onCheckedChange={checked => setColor(NONE, checked)}
              onSelect={keepOpen}
            >
              {getMessage('ruleViewNoColor')}
            </DropdownMenu.CheckboxItem>
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>

        <CategoryFilterSubMenu
          selected={value.filterCategories}
          onToggle={setCategory}
          testIdPrefix="page-rules-view"
          subLabel={getMessage('ruleViewFilterByCategory')}
          noneLabel={getMessage('ruleViewNoCategory')}
          categories={categories}
        />

        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger data-testid="page-rules-view-sub-status">
            {getMessage('ruleViewFilterByStatus')}
          </DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            <DropdownMenu.CheckboxItem
              data-testid="page-rules-view-status-enabled"
              checked={value.filterStatus.includes('enabled')}
              onCheckedChange={checked => setStatus('enabled', checked)}
              onSelect={keepOpen}
            >
              {getMessage('ruleViewStatusEnabled')}
            </DropdownMenu.CheckboxItem>
            <DropdownMenu.CheckboxItem
              data-testid="page-rules-view-status-disabled"
              checked={value.filterStatus.includes('disabled')}
              onCheckedChange={checked => setStatus('disabled', checked)}
              onSelect={keepOpen}
            >
              {getMessage('ruleViewStatusDisabled')}
            </DropdownMenu.CheckboxItem>
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>

        <DropdownMenu.Separator />

        {/* ── Sort ── */}
        <DropdownMenu.Label>{getMessage('ruleViewSortLabel')}</DropdownMenu.Label>
        <DropdownMenu.RadioGroup
          value={value.sort}
          onValueChange={v => setSort(v as RuleSortMode)}
        >
          <DropdownMenu.RadioItem value="manual" data-testid="page-rules-view-sort-manual" onSelect={keepOpen}>
            {getMessage('ruleViewSortManual')}
          </DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="date" data-testid="page-rules-view-sort-date" onSelect={keepOpen}>
            {getMessage('ruleViewSortDate')}
          </DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="category" data-testid="page-rules-view-sort-category" onSelect={keepOpen}>
            {getMessage('ruleViewSortCategory')}
          </DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="color" data-testid="page-rules-view-sort-color" onSelect={keepOpen}>
            {getMessage('ruleViewSortColor')}
          </DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="domain" data-testid="page-rules-view-sort-domain" onSelect={keepOpen}>
            {getMessage('ruleViewSortDomain')}
          </DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>

        {value.sort !== 'manual' && (
          <>
            <DropdownMenu.Label>{getMessage('ruleViewSortDirectionLabel')}</DropdownMenu.Label>
            <DropdownMenu.RadioGroup
              value={value.sortDirection}
              onValueChange={v => setDirection(v as RuleSortDirection)}
            >
              <DropdownMenu.RadioItem value="asc" data-testid="page-rules-view-dir-asc" onSelect={keepOpen}>
                {getMessage('ruleViewSortAscending')}
              </DropdownMenu.RadioItem>
              <DropdownMenu.RadioItem value="desc" data-testid="page-rules-view-dir-desc" onSelect={keepOpen}>
                {getMessage('ruleViewSortDescending')}
              </DropdownMenu.RadioItem>
            </DropdownMenu.RadioGroup>
          </>
        )}

        <DropdownMenu.Separator />

        {/* ── Group ── */}
        <DropdownMenu.Label>{getMessage('ruleViewGroupLabel')}</DropdownMenu.Label>
        <DropdownMenu.RadioGroup
          value={value.group}
          onValueChange={v => setGroup(v as RuleGroupMode)}
        >
          <DropdownMenu.RadioItem value="none" data-testid="page-rules-view-group-none" onSelect={keepOpen}>
            {getMessage('ruleViewGroupNone')}
          </DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="category" data-testid="page-rules-view-group-category" onSelect={keepOpen}>
            {getMessage('ruleViewGroupCategory')}
          </DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="color" data-testid="page-rules-view-group-color" onSelect={keepOpen}>
            {getMessage('ruleViewGroupColor')}
          </DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="status" data-testid="page-rules-view-group-status" onSelect={keepOpen}>
            {getMessage('ruleViewGroupStatus')}
          </DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>

        {isActive && (
          <>
            <DropdownMenu.Separator />
            <DropdownMenu.Item data-testid="page-rules-view-reset" onSelect={reset}>
              <Flex align="center" gap="2">
                <RotateCcw size={14} aria-hidden="true" />
                {getMessage('ruleViewResetLabel')}
              </Flex>
            </DropdownMenu.Item>
          </>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
