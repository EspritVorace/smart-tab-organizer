import type { SearchableSelectGroup } from '@/components/Form/FormFields/SearchableSelect';
import type { PresetCategory } from '@/types/preset';
import { getRuleCategory, getCategoryLabel } from './categoriesStore';

/**
 * Transforms an array of preset categories into groups for SearchableSelect.
 * Labels and emojis are resolved from the unified category source via
 * `categoriesStore`. If a category is unknown (store not initialized or stale
 * preset ID), falls back to the raw ID so the dropdown still renders.
 */
export function presetsToSearchableGroups(categories: PresetCategory[]): SearchableSelectGroup[] {
  return categories.map((cat) => {
    const ruleCategory = getRuleCategory(cat.id);
    const label = ruleCategory
      ? `${ruleCategory.emoji} ${getCategoryLabel(ruleCategory)}`
      : cat.id;
    return {
      label,
      options: cat.presets.map((p) => ({
        value: p.id,
        label: p.name,
      })),
    };
  });
}
