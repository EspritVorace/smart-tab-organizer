import { useEffect, useRef, useId, type ReactNode } from 'react';
import { Command } from 'cmdk';
import { Search } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import './SearchableSelect.css';
import type { SearchableSelectGroup, SearchableSelectOption } from './SearchableSelect';
import { SearchableSelectItem } from './SearchableSelectItem';

export interface SearchableInlineListProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Flat list — use either options or groups, not both */
  options?: SearchableSelectOption[];
  /** Grouped list */
  groups?: SearchableSelectGroup[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  /** Auto-focus the search input on mount. Default false. */
  autoFocus?: boolean;
  className?: string;
  /** For linking to a label via htmlFor (set on the search input). */
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /**
   * Optional row renderer. When provided, it replaces the default
   * `SearchableSelectItem` for every option (the panel supplies rich rows:
   * host, coverage badge, tab count). It must render a cmdk `Command.Item` so
   * keyboard navigation and filtering keep working. When absent, behavior is
   * unchanged.
   */
  renderItem?: (option: SearchableSelectOption) => ReactNode;
}

/**
 * Inline cmdk command palette: search input + scrollable list of items/groups.
 * Behaves like SearchableSelect but without trigger/popover — fills its container.
 */
export function SearchableInlineList({
  value,
  onValueChange,
  options,
  groups,
  searchPlaceholder,
  emptyMessage,
  autoFocus = false,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  renderItem,
}: SearchableInlineListProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // cmdk's Command.Input overrides the `id` prop with its internal useId,
  // so we re-apply the caller-provided id directly on the DOM node.
  useEffect(() => {
    if (id && inputRef.current) inputRef.current.id = id;
  }, [id]);

  useEffect(() => {
    if (!autoFocus) return;
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [autoFocus]);

  // Center the pre-selected item on mount so the user does not have to scroll
  // to find it (e.g. edit-mode dialogs reopening on a saved value).
  useEffect(() => {
    if (!value) return;
    const t = setTimeout(() => {
      const selected = containerRef.current?.querySelector<HTMLElement>('.ss-item--selected');
      selected?.scrollIntoView({ block: 'center', behavior: 'auto' });
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderOption = (option: SearchableSelectOption) =>
    renderItem ? (
      renderItem(option)
    ) : (
      <SearchableSelectItem
        key={option.value}
        option={option}
        selectedValue={value}
        onSelect={onValueChange}
      />
    );

  return (
    <div
      ref={containerRef}
      className={['ss-inline', className].filter(Boolean).join(' ')}
      aria-label={ariaLabelledBy ? undefined : ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      <Command>
        <div className="ss-search">
          <Search size={14} className="ss-search__icon" />
          <Command.Input
            ref={inputRef}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder ?? getMessage('searchableSelectSearchLabel')}
            className="ss-search__input"
          />
        </div>
        <Command.List id={listboxId} className="ss-list ss-list--inline">
          <Command.Empty className="ss-empty">{emptyMessage}</Command.Empty>
          {options && options.length > 0
            ? options.map(renderOption)
            : groups?.map((group) => (
                <Command.Group key={group.label} heading={group.label} className="ss-group">
                  {group.options.map(renderOption)}
                </Command.Group>
              ))}
        </Command.List>
      </Command>
    </div>
  );
}
