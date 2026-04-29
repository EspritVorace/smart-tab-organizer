import React, { useState } from 'react';
import { Popover, Tooltip } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import { getRuleCategory, getCategoryLabel } from '@/utils/categoriesStore';
import { useSettings } from '@/hooks/useSettings';
import { chromeGroupColors } from '@/utils/tabTreeUtils';
import styles from './CategoryPicker.module.css';

export interface CategoryPickerProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const { settings } = useSettings();
  const categories = settings?.categories ?? [];
  const selectedCategory = getRuleCategory(value);
  const selectedLabel = selectedCategory ? getCategoryLabel(selectedCategory) : getMessage('categoryNone');

  function handleSelect(id: string | null) {
    onChange(id);
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger>
        <button
          type="button"
          aria-label={selectedLabel}
          title={selectedLabel}
          className={`${styles.trigger} ${!selectedCategory ? styles.triggerNone : ''}`}
          style={selectedCategory ? { backgroundColor: chromeGroupColors[selectedCategory.color] } : undefined}
        >
          {selectedCategory ? selectedCategory.emoji : null}
        </button>
      </Popover.Trigger>
      <Popover.Content side="bottom" align="start" style={{ padding: 'var(--space-3)' }}>
        <div
          className={styles.grid}
          role="radiogroup"
          aria-label={getMessage('color')}
        >
          {/* None option */}
          <Tooltip content={getMessage('categoryNone')}>
            <button
              type="button"
              role="radio"
              aria-checked={!value}
              aria-label={getMessage('categoryNone')}
              className={`${styles.swatch} ${styles.swatchNone} ${!value ? styles.swatchActive : ''}`}
              onClick={() => handleSelect(null)}
            />
          </Tooltip>

          {/* Category options */}
          {categories.map((category) => {
            const label = getCategoryLabel(category);
            return (
              <Tooltip key={category.id} content={label}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={value === category.id}
                  aria-label={label}
                  className={`${styles.swatch} ${value === category.id ? styles.swatchActive : ''}`}
                  style={{ backgroundColor: chromeGroupColors[category.color] }}
                  onClick={() => handleSelect(category.id)}
                >
                  {category.emoji}
                </button>
              </Tooltip>
            );
          })}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
