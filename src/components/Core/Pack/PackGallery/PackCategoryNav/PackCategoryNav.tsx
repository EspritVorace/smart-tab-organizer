import { useCallback, useMemo, useRef } from 'react';
import { getMessage } from '@/utils/i18n';
import { resolvePackCategoryLabel } from '@/utils/packLabel';
import type { PackCategory } from '@/schemas/pack';
import styles from '@/components/Core/Pack/PackGallery/PackGallery.module.css';

export const ALL_CATEGORIES = '__all__';

export interface PackCategoryNavItem {
  id: string;
  label: string;
  icon?: string;
  count: number;
}

interface PackCategoryNavProps {
  categories: PackCategory[];
  countsByCategory: Map<string | null, number>;
  totalCount: number;
  activeCategory: string;
  onActiveCategoryChange: (next: string) => void;
}

export function PackCategoryNav({
  categories,
  countsByCategory,
  totalCount,
  activeCategory,
  onActiveCategoryChange,
}: PackCategoryNavProps) {
  const navRef = useRef<HTMLDivElement>(null);

  const items = useMemo<PackCategoryNavItem[]>(
    () => [
      {
        id: ALL_CATEGORIES,
        label: getMessage('packGalleryCategoryNavAll'),
        count: totalCount,
      },
      ...categories
        .filter((cat) => (countsByCategory.get(cat.id) ?? 0) > 0)
        .map((cat) => ({
          id: cat.id,
          label: resolvePackCategoryLabel(cat),
          icon: cat.icon,
          count: countsByCategory.get(cat.id) ?? 0,
        })),
    ],
    [categories, countsByCategory, totalCount],
  );

  const focusChip = useCallback((id: string) => {
    const root = navRef.current;
    if (!root) return;
    const next = root.querySelector<HTMLButtonElement>(
      `[data-category-id="${id}"]`,
    );
    next?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const { key } = event;
      if (
        key !== 'ArrowLeft' &&
        key !== 'ArrowRight' &&
        key !== 'Home' &&
        key !== 'End'
      ) {
        return;
      }
      event.preventDefault();
      const currentIndex = items.findIndex((it) => it.id === activeCategory);
      const safeIndex = currentIndex < 0 ? 0 : currentIndex;
      let nextIndex = safeIndex;
      if (key === 'ArrowRight') nextIndex = (safeIndex + 1) % items.length;
      else if (key === 'ArrowLeft')
        nextIndex = (safeIndex - 1 + items.length) % items.length;
      else if (key === 'Home') nextIndex = 0;
      else if (key === 'End') nextIndex = items.length - 1;
      const target = items[nextIndex];
      if (!target) return;
      onActiveCategoryChange(target.id);
      focusChip(target.id);
    },
    [activeCategory, focusChip, items, onActiveCategoryChange],
  );

  return (
    <div
      ref={navRef}
      role="tablist"
      tabIndex={-1}
      aria-label={getMessage('packGalleryCategoryNavLabel')}
      className={styles.categoryNav}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.categoryNavTrack}>
        {items.map((item) => {
          const isActive = activeCategory === item.id;
          return (
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              key={item.id}
              data-category-id={item.id}
              className={styles.categoryChip}
              onClick={() => onActiveCategoryChange(item.id)}
            >
              {item.icon && (
                <span aria-hidden="true" className={styles.categoryChipEmoji}>
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
              <span aria-hidden="true" className={styles.categoryChipCount}>
                {item.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
