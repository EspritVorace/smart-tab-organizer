import { useRef } from 'react';
import { Flex, Tooltip } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import { getCategoryLabel } from '@/utils/categoriesStore';
import { useSettings } from '@/hooks/useSettings';
import { useListNavigation } from '@/hooks/useListNavigation';
import styles from './CategoryPicker.module.css';

export interface CategoryRadioGroupProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  'aria-label'?: string;
  'data-testid'?: string;
  swatchTestIdPrefix?: string;
  /**
   * When true (default), focusing a swatch via arrow keys also commits the
   * selection (ARIA "automatic activation" pattern, recommended for an
   * inline radiogroup). Set to false in contexts where selection must be
   * explicit, e.g. inside a popover that closes on selection.
   */
  selectOnFocus?: boolean;
}

export function CategoryRadioGroup({
  value,
  onChange,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  swatchTestIdPrefix,
  selectOnFocus = true,
}: CategoryRadioGroupProps) {
  const { settings } = useSettings();
  const categories = settings?.categories ?? [];
  const listRef = useRef<HTMLDivElement>(null);
  const { handleNavigationKey } = useListNavigation(listRef, '[role="radio"]', {
    axis: 'both',
    rovingTabIndex: true,
  });

  const noneLabel = getMessage('categoryNone');
  const groupLabel = ariaLabel ?? getMessage('categoryPickerLabel');

  // Build a flat list of options to keep indices aligned with the DOM order
  // expected by useListNavigation.
  const options: Array<{ id: string | null; label: string; emoji: string | null }> = [
    { id: null, label: noneLabel, emoji: null },
    ...categories.map((c) => ({ id: c.id, label: getCategoryLabel(c), emoji: c.emoji })),
  ];

  const swatchTestId = (id: string | null) => {
    if (!swatchTestIdPrefix) return undefined;
    return `${swatchTestIdPrefix}-${id ?? 'none'}`;
  };

  return (
    <Flex
      ref={listRef}
      align="center"
      gap="2"
      wrap="wrap"
      role="radiogroup"
      aria-label={groupLabel}
      data-testid={dataTestId}
    >
      {options.map((option, index) => {
        const isSelected = (option.id ?? null) === (value ?? null);
        const isNone = option.id === null;
        return (
          <Tooltip key={option.id ?? '__none__'} content={option.label}>
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={option.label}
              data-testid={swatchTestId(option.id)}
              tabIndex={isSelected ? 0 : -1}
              className={`${styles.swatch} ${isNone ? styles.swatchNone : ''} ${isSelected ? styles.swatchActive : ''}`}
              onClick={() => onChange(option.id)}
              onFocus={selectOnFocus ? () => onChange(option.id) : undefined}
              onKeyDown={(e) => handleNavigationKey(e, index)}
            >
              {option.emoji}
            </button>
          </Tooltip>
        );
      })}
    </Flex>
  );
}
