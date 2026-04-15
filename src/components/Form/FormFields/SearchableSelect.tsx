import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { Command } from 'cmdk';
import { ChevronDown, Check, Search } from 'lucide-react';
import './SearchableSelect.css';

export interface SearchableSelectOption {
  value: string;
  label: string;
  /** Short label shown in trigger when selected (fallback to label) */
  triggerLabel?: string;
  disabled?: boolean;
}

export interface SearchableSelectGroup {
  label: string;
  options: SearchableSelectOption[];
}

export interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Flat list — use either options or groups, not both */
  options?: SearchableSelectOption[];
  /** Grouped list */
  groups?: SearchableSelectGroup[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  /** Max dropdown height in px (default: 320) */
  maxHeight?: number;
  className?: string;
  /** For linking the trigger to a label via htmlFor */
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

function findOption(
  value: string,
  options?: SearchableSelectOption[],
  groups?: SearchableSelectGroup[]
): SearchableSelectOption | undefined {
  if (options) return options.find((o) => o.value === value);
  if (groups) {
    for (const g of groups) {
      const found = g.options.find((o) => o.value === value);
      if (found) return found;
    }
  }
  return undefined;
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  groups,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled = false,
  maxHeight = 320,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const selectedOption = value ? findOption(value, options, groups) : undefined;
  const triggerText = selectedOption
    ? (selectedOption.triggerLabel ?? selectedOption.label)
    : undefined;

  // Compute position from trigger's viewport rect
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: r.bottom + 4,
      left: r.left,
      width: r.width,
      maxHeight,
      zIndex: 9999,
    });
  }, [maxHeight]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setOpen(false);
    setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  const renderItem = (option: SearchableSelectOption) => {
    const isSelected = option.value === value;
    return (
      <Command.Item
        key={option.value}
        value={`${option.value} ${option.label}`}
        onSelect={() => {
          if (!option.disabled) handleSelect(option.value);
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
    <div ref={containerRef} className={['ss-root', className].filter(Boolean).join(' ')}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        className={['ss-trigger', open ? 'ss-trigger--open' : ''].filter(Boolean).join(' ')}
        onClick={() => !disabled && setOpen((prev) => !prev)}
      >
        <span
          className={[
            'ss-trigger__label',
            triggerText ? 'ss-trigger__label--has-value' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {triggerText ?? placeholder}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={['ss-trigger__icon', open ? 'ss-trigger__icon--open' : '']
            .filter(Boolean)
            .join(' ')}
        />
      </button>

      {open && (
        <div className="ss-dropdown" style={dropdownStyle}>
          <Command>
            <div className="ss-search">
              <Search size={14} aria-hidden="true" className="ss-search__icon" />
              <Command.Input
                ref={inputRef}
                placeholder={searchPlaceholder}
                className="ss-search__input"
                onKeyDown={handleInputKeyDown}
              />
            </div>
            <Command.List id={listboxId} className="ss-list" style={{ maxHeight: maxHeight - 48 }}>
              <Command.Empty className="ss-empty">{emptyMessage}</Command.Empty>

              {options && options.length > 0
                ? options.map((option) => renderItem(option))
                : groups?.map((group) => (
                    <Command.Group
                      key={group.label}
                      heading={group.label}
                      className="ss-group"
                    >
                      {group.options.map((option) => renderItem(option))}
                    </Command.Group>
                  ))}
            </Command.List>
          </Command>
        </div>
      )}
    </div>
  );
}
