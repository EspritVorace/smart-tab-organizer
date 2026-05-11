import { Command } from 'cmdk';
import { Check } from 'lucide-react';
import type { SearchableSelectOption } from './SearchableSelect';

interface SearchableSelectItemProps {
  option: SearchableSelectOption;
  selectedValue: string;
  onSelect: (value: string) => void;
}

/**
 * `Command.Item` row shared by `SearchableSelect` and `SearchableInlineList`.
 * Handles the selected/disabled visual states and skips `onSelect` when the
 * option is disabled. Callers set `key` at the call site.
 */
export function SearchableSelectItem({
  option,
  selectedValue,
  onSelect,
}: SearchableSelectItemProps) {
  const isSelected = option.value === selectedValue;
  return (
    <Command.Item
      value={`${option.value} ${option.label}`}
      onSelect={() => {
        if (!option.disabled) onSelect(option.value);
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
        <Check size={14} />
      </span>
      <span className="ss-item__label">{option.label}</span>
    </Command.Item>
  );
}
