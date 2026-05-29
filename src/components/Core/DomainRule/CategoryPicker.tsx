import { useState } from 'react';
import { Popover } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import { getRuleCategory, getCategoryLabel } from '@/utils/categoriesStore';
import { CategoryRadioGroup } from './CategoryRadioGroup';
import styles from './CategoryPicker.module.css';

export interface CategoryPickerProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const selectedCategory = getRuleCategory(value);
  const selectedLabel = selectedCategory
    ? getCategoryLabel(selectedCategory)
    : getMessage('categoryNone');

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
        >
          {selectedCategory ? selectedCategory.emoji : null}
        </button>
      </Popover.Trigger>
      <Popover.Content side="bottom" align="start" style={{ padding: 'var(--space-3)', width: 176 }}>
        <CategoryRadioGroup value={value} onChange={handleSelect} selectOnFocus={false} />
      </Popover.Content>
    </Popover.Root>
  );
}
