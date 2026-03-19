import type { SearchableSelectGroup } from '../components/Form/FormFields/SearchableSelect';
import type { PresetCategory } from '../types/preset';

/**
 * Transforms an array of preset categories into groups for SearchableSelect.
 */
export function presetsToSearchableGroups(categories: PresetCategory[]): SearchableSelectGroup[] {
  return categories.map((cat) => ({
    label: cat.name,
    options: cat.presets.map((p) => ({
      value: p.id,
      label: p.name,
    })),
  }));
}
