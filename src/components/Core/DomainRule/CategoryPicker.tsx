import React, { useState } from 'react';
import { Popover, Tooltip } from '@radix-ui/themes';
import { getMessage } from '../../../utils/i18n';
import { RULE_CATEGORIES, getRuleCategory } from '../../../schemas/enums';
import type { RuleCategoryId } from '../../../schemas/enums';
import { chromeGroupColors } from '../../../utils/tabTreeUtils';
import styles from './CategoryPicker.module.css';

export interface CategoryPickerProps {
  value: RuleCategoryId | null | undefined;
  onChange: (value: RuleCategoryId | null) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const selectedCategory = getRuleCategory(value);

  function handleSelect(id: RuleCategoryId | null) {
    onChange(id);
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger>
        <button
          type="button"
          aria-label={selectedCategory ? getMessage(selectedCategory.labelKey as any) : getMessage('categoryNone')}
          title={selectedCategory ? getMessage(selectedCategory.labelKey as any) : getMessage('categoryNone')}
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
          {RULE_CATEGORIES.map((category) => (
            <Tooltip key={category.id} content={getMessage(category.labelKey as any)}>
              <button
                type="button"
                role="radio"
                aria-checked={value === category.id}
                aria-label={getMessage(category.labelKey as any)}
                className={`${styles.swatch} ${value === category.id ? styles.swatchActive : ''}`}
                style={{ backgroundColor: chromeGroupColors[category.color] }}
                onClick={() => handleSelect(category.id as RuleCategoryId)}
              >
                {category.emoji}
              </button>
            </Tooltip>
          ))}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
