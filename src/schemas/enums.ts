// Types pour les enum avec clés de traduction
export const colorOptions = [
  { value: 'grey', keyLabel: 'color_grey' },
  { value: 'blue', keyLabel: 'color_blue' },
  { value: 'red', keyLabel: 'color_red' },
  { value: 'yellow', keyLabel: 'color_yellow' },
  { value: 'green', keyLabel: 'color_green' },
  { value: 'pink', keyLabel: 'color_pink' },
  { value: 'purple', keyLabel: 'color_purple' },
  { value: 'cyan', keyLabel: 'color_cyan' },
  { value: 'orange', keyLabel: 'color_orange' }
] as const;

// Catégories de règles de domaine (chacune associe un emoji + une couleur Chrome)
export const RULE_CATEGORIES = [
  { id: 'development',  emoji: '💻', color: 'blue',   labelKey: 'category_development' },
  { id: 'productivity', emoji: '📋', color: 'purple', labelKey: 'category_productivity' },
  { id: 'commerce',     emoji: '🛍️', color: 'orange', labelKey: 'category_commerce' },
  { id: 'travel',       emoji: '✈️',  color: 'cyan',   labelKey: 'category_travel' },
  { id: 'search',       emoji: '🔍', color: 'yellow', labelKey: 'category_search' },
  { id: 'social',       emoji: '💬', color: 'pink',   labelKey: 'category_social' },
  { id: 'media',        emoji: '🎬', color: 'red',    labelKey: 'category_media' },
  { id: 'cloud',        emoji: '☁️',  color: 'blue',   labelKey: 'category_cloud' },
  { id: 'finance',      emoji: '💰', color: 'green',  labelKey: 'category_finance' },
  { id: 'education',    emoji: '🎓', color: 'yellow', labelKey: 'category_education' },
] as const;

export type RuleCategoryId = typeof RULE_CATEGORIES[number]['id'];

export function getRuleCategory(categoryId?: string | null) {
  if (!categoryId) return null;
  return RULE_CATEGORIES.find(c => c.id === categoryId) ?? null;
}

export const groupNameSourceOptions = [
  { value: 'title', keyLabel: 'groupNameSourceTitle' },
  { value: 'url', keyLabel: 'groupNameSourceUrl' },
  { value: 'manual', keyLabel: 'groupNameSourceManual' },
  { value: 'smart', keyLabel: 'groupNameSourceSmart' },
  { value: 'smart_manual', keyLabel: 'groupNameSourceSmartManual' },
  { value: 'smart_preset', keyLabel: 'groupNameSourceSmartPreset' },
  { value: 'smart_label', keyLabel: 'groupNameSourceSmartLabel' }
] as const;

export const deduplicationMatchModeOptions = [
  { value: 'exact', keyLabel: 'exactMatch' },
  { value: 'includes', keyLabel: 'includesMatch' }
] as const;

export const badgeOptions = [
  { value: 'NEW', color: 'green', keyLabel: 'badge_new' },
  { value: 'WARNING', color: 'orange', keyLabel: 'badge_warning' },
  { value: 'DELETED', color: 'red', keyLabel: 'badge_deleted' }
] as const;

// Types pour les valeurs des enum
export type ColorValue = typeof colorOptions[number]['value'];
export type GroupNameSourceValue = typeof groupNameSourceOptions[number]['value'];
export type DeduplicationMatchModeValue = typeof deduplicationMatchModeOptions[number]['value'];
export type BadgeType = typeof badgeOptions[number]['value'];