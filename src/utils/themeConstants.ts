export const FEATURE_THEMES = {
  DOMAIN_RULES: 'indigo',
  REGEX_PRESETS: 'indigo',
  IMPORT: 'indigo',
  EXPORT: 'indigo',
  STATISTICS: 'indigo',
  SETTINGS: 'indigo',
  SESSIONS: 'indigo'
} as const;

// Couleurs de base par fonctionnalité
export const FEATURE_BASE_COLORS = {
  DOMAIN_RULES: 'indigo',
  REGEX_PRESETS: 'indigo',
  IMPORT: 'indigo',
  EXPORT: 'indigo',
  STATISTICS: 'indigo',
  SETTINGS: 'indigo',
  SESSIONS: 'indigo'
} as const;

// Couleurs par type de callout avec nuances appropriées
export const FEATURE_CALLOUT_COLORS = {
  DOMAIN_RULES: {
    INFO: 'purple',
    WARNING: 'violet', // Plus chaud pour warning
    ERROR: 'plum'      // Plus intense pour erreur
  },
  REGEX_PRESETS: {
    INFO: 'cyan',
    WARNING: 'sky',    // Nuance plus chaude
    ERROR: 'blue'      // Plus intense
  },
  IMPORT: {
    INFO: 'jade',
    WARNING: 'teal',   // Nuance vers le bleu
    ERROR: 'green'     // Plus classique pour erreur
  },
  EXPORT: {
    INFO: 'teal',
    WARNING: 'cyan',   // Nuance plus vive
    ERROR: 'blue'      // Contraste pour erreur
  },
  STATISTICS: {
    INFO: 'orange',
    WARNING: 'amber',  // Couleur warning classique
    ERROR: 'red'       // Rouge pour erreur
  },
  SETTINGS: {
    INFO: 'gray',
    WARNING: 'gray',   // Nuance neutre
    ERROR: 'red'       // Rouge standard pour erreur
  },
  SESSIONS: {
    INFO: 'indigo',
    WARNING: 'iris',    // Nuance plus chaude
    ERROR: 'violet'     // Plus intense pour erreur
  }
} as const;

export const DEFAULT_CALLOUT_COLORS = {
  INFO: 'blue',
  WARNING: 'amber',
  ERROR: 'red'
} as const;

export type FeatureTheme = keyof typeof FEATURE_THEMES;
export type FeatureCalloutColors = typeof FEATURE_CALLOUT_COLORS[keyof typeof FEATURE_CALLOUT_COLORS];
export type CalloutColor = FeatureCalloutColors[keyof FeatureCalloutColors] | typeof DEFAULT_CALLOUT_COLORS[keyof typeof DEFAULT_CALLOUT_COLORS];