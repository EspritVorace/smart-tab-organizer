// Enum types with their translation keys.
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

export const groupNameSourceOptions = [
  { value: 'title', keyLabel: 'groupNameSourceTitle' },
  { value: 'url', keyLabel: 'groupNameSourceUrl' },
  { value: 'manual', keyLabel: 'groupNameSourceManual' },
  { value: 'smart', keyLabel: 'groupNameSourceSmart' },
  { value: 'smart_manual', keyLabel: 'groupNameSourceSmartManual' },
  { value: 'smart_preset', keyLabel: 'groupNameSourceSmartPreset' },
  { value: 'smart_label', keyLabel: 'groupNameSourceSmartLabel' },
  { value: 'label', keyLabel: 'groupNameSourceLabel' }
] as const;

export const deduplicationMatchModeOptions = [
  { value: 'exact', keyLabel: 'exactMatch' },
  { value: 'includes', keyLabel: 'includesMatch' },
  { value: 'exact_ignore_params', keyLabel: 'exactIgnoreParamsMatch' }
] as const;

export const urlExtractionModeOptions = [
  { value: 'regex', keyLabel: 'urlExtractionModeRegex' },
  { value: 'query_param', keyLabel: 'urlExtractionModeQueryParam' }
] as const;

export const deduplicationKeepStrategyOptions = [
  { value: 'keep-old', keyLabel: 'deduplicationKeepStrategyOldLabel' },
  { value: 'keep-new', keyLabel: 'deduplicationKeepStrategyNewLabel' },
  { value: 'keep-grouped', keyLabel: 'deduplicationKeepStrategyGroupedLabel' },
  { value: 'keep-grouped-or-new', keyLabel: 'deduplicationKeepStrategyGroupedOrNewLabel' }
] as const;

export const badgeOptions = [
  { value: 'NEW', color: 'green', keyLabel: 'badge_new' },
  { value: 'WARNING', color: 'orange', keyLabel: 'badge_warning' },
  { value: 'DELETED', color: 'red', keyLabel: 'badge_deleted' }
] as const;

// Value types extracted from the enum option lists above.
export type ColorValue = typeof colorOptions[number]['value'];
export type GroupNameSourceValue = typeof groupNameSourceOptions[number]['value'];
export type DeduplicationMatchModeValue = typeof deduplicationMatchModeOptions[number]['value'];
export type DeduplicationKeepStrategyValue = typeof deduplicationKeepStrategyOptions[number]['value'];
export type BadgeType = typeof badgeOptions[number]['value'];
export type UrlExtractionModeValue = typeof urlExtractionModeOptions[number]['value'];