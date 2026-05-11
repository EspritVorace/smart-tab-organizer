export const FEATURE_THEMES = {
  DOMAIN_RULES: 'indigo',
  REGEX_PRESETS: 'indigo',
  IMPORT: 'indigo',
  EXPORT: 'indigo',
  STATISTICS: 'indigo',
  SETTINGS: 'indigo',
  SESSIONS: 'indigo'
} as const;

// Base color per feature.
export const FEATURE_BASE_COLORS = {
  DOMAIN_RULES: 'indigo',
  REGEX_PRESETS: 'indigo',
  IMPORT: 'indigo',
  EXPORT: 'indigo',
  STATISTICS: 'indigo',
  SETTINGS: 'indigo',
  SESSIONS: 'indigo'
} as const;

export type FeatureTheme = keyof typeof FEATURE_THEMES;