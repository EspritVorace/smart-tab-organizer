import type { SearchableSelectGroup } from '@/components/Form/FormFields/SearchableSelect';
import type { PresetCategory } from '@/types/preset';
import { getRuleCategory, getCategoryLabel } from './categoriesStore';
import { getSuggestedPresetIds } from './presetSuggestions';

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

/**
 * Like {@link presetsToSearchableGroups}, but prepends a leading "Suggested for
 * this domain" group built from the presets whose non-`*` domain filters match
 * `domain` (see {@link getSuggestedPresetIds}). Suggested presets are removed
 * from their category group (dedupe by id, leading group wins), and any group
 * emptied by that removal is dropped to avoid an orphan heading. When `domain`
 * is empty or no specific preset matches, the result is identical to
 * {@link presetsToSearchableGroups}.
 *
 * The heading label is injected by the caller so this module stays free of i18n
 * concerns and remains trivially testable.
 */
export function presetsToSearchableGroupsWithSuggestions(
  categories: PresetCategory[],
  domain: string | null | undefined,
  suggestedHeading: string,
): SearchableSelectGroup[] {
  const baseGroups = presetsToSearchableGroups(categories);
  const suggestedIds = getSuggestedPresetIds(domain, categories);
  if (suggestedIds.length === 0) return baseGroups;

  const suggestedSet = new Set(suggestedIds);
  const idToName = new Map<string, string>();
  for (const cat of categories) {
    for (const preset of cat.presets) idToName.set(preset.id, preset.name);
  }

  const leadingGroup: SearchableSelectGroup = {
    label: suggestedHeading,
    options: suggestedIds.map((id) => ({ value: id, label: idToName.get(id) ?? id })),
  };

  const dedupedBase = baseGroups
    .map((group) => ({
      ...group,
      options: group.options.filter((option) => !suggestedSet.has(option.value)),
    }))
    .filter((group) => group.options.length > 0);

  return [leadingGroup, ...dedupedBase];
}
