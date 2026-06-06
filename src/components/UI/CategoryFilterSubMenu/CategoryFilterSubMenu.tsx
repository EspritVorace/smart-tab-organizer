import { DropdownMenu, Flex } from '@radix-ui/themes';
import { getAllCategories, getCategoryLabel } from '@/utils/categoriesStore';
import type { RuleCategory } from '@/schemas/category';

const NONE = '__none__';

export interface CategoryFilterSubMenuProps {
  /** Selected category ids; `'__none__'` keeps items without a category. */
  selected: string[];
  onToggle: (id: string, checked: boolean) => void;
  /** Prefix for the `data-testid` attributes (e.g. `page-rules-view`). */
  testIdPrefix: string;
  /** Localized sub-trigger label. */
  subLabel: string;
  /** Localized label for the "no category" option. */
  noneLabel: string;
  /** Categories to display. Defaults to the built-in set. */
  categories?: RuleCategory[];
}

/**
 * Shared "filter by category" sub-menu used by the rules and sessions view
 * menus. Renders one checkbox per category plus a "no category" option, kept
 * open while toggling.
 */
export function CategoryFilterSubMenu({
  selected,
  onToggle,
  testIdPrefix,
  subLabel,
  noneLabel,
  categories,
}: CategoryFilterSubMenuProps) {
  const cats = categories ?? getAllCategories();
  const keepOpen = (event: Event) => event.preventDefault();

  return (
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger data-testid={`${testIdPrefix}-sub-category`}>
        {subLabel}
      </DropdownMenu.SubTrigger>
      <DropdownMenu.SubContent>
        {cats.map(cat => (
          <DropdownMenu.CheckboxItem
            key={cat.id}
            data-testid={`${testIdPrefix}-category-${cat.id}`}
            checked={selected.includes(cat.id)}
            onCheckedChange={checked => onToggle(cat.id, checked)}
            onSelect={keepOpen}
          >
            <Flex align="center" gap="2">
              <span aria-hidden="true">{cat.emoji}</span>
              {getCategoryLabel(cat)}
            </Flex>
          </DropdownMenu.CheckboxItem>
        ))}
        <DropdownMenu.CheckboxItem
          data-testid={`${testIdPrefix}-category-none`}
          checked={selected.includes(NONE)}
          onCheckedChange={checked => onToggle(NONE, checked)}
          onSelect={keepOpen}
        >
          {noneLabel}
        </DropdownMenu.CheckboxItem>
      </DropdownMenu.SubContent>
    </DropdownMenu.Sub>
  );
}
