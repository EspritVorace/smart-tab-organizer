import { useEffect, useRef, useId } from 'react';
import { Command } from 'cmdk';
import { Check, Search } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import './SearchableSelect.css';
import type { SearchableSelectGroup, SearchableSelectOption } from './SearchableSelect';

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
}: SearchableInlineListProps) {
  const inputRef = useRef<HTMLInputElement>(null);
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

  const renderItem = (option: SearchableSelectOption) => {
    const isSelected = option.value === value;
    return (
      <Command.Item
        key={option.value}
        value={`${option.value} ${option.label}`}
        onSelect={() => {
          if (!option.disabled) onValueChange(option.value);
        }}
        disabled={option.disabled}
        className={[
          'ss-item',
          isSelected ? 'ss-item--selected' : '',
          option.disabled ? 'ss-item--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-selected={isSelected}
      >
        <span className="ss-item__check">
          <Check size={14} aria-hidden="true" />
        </span>
        <span className="ss-item__label">{option.label}</span>
      </Command.Item>
    );
  };

  return (
    <div
      className={['ss-inline', className].filter(Boolean).join(' ')}
      aria-label={ariaLabelledBy ? undefined : ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      <Command>
        <div className="ss-search">
          <Search size={14} aria-hidden="true" className="ss-search__icon" />
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
            ? options.map(renderItem)
            : groups?.map((group) => (
                <Command.Group key={group.label} heading={group.label} className="ss-group">
                  {group.options.map(renderItem)}
                </Command.Group>
              ))}
        </Command.List>
      </Command>
    </div>
  );
}
