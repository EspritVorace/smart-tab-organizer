import type { RegexPreset } from '../schemas/regexPreset.js';
import type { LogicalGroup } from '../schemas/logicalGroup.js';
import type { DomainRule } from '../schemas/domainRule.js';

// Type DarkModePreference basé sur les valeurs de default_settings.json
export type DarkModePreference = 'system' | 'light' | 'dark';

// Types Settings qui étendent les types Zod inférés
export interface RegexPresetSetting extends RegexPreset {
  // Pas de champ enabled pour l'instant, mais conservé pour uniformité
}

export interface LogicalGroupSetting extends LogicalGroup {
  enabled?: boolean;
}

export interface DomainRuleSetting extends DomainRule {
  enabled: boolean;
}

// Types pour les arrays
export type RegexPresetSettings = RegexPresetSetting[];
export type LogicalGroupSettings = LogicalGroupSetting[];
export type DomainRuleSettings = DomainRuleSetting[];

// Interface SyncSettings qui étend les types Zod inférés
export interface SyncSettings {
  globalGroupingEnabled: boolean;
  globalDeduplicationEnabled: boolean;
  darkModePreference: DarkModePreference;
  regexPresets: RegexPresetSettings;
  logicalGroups: LogicalGroupSettings;
  domainRules: DomainRuleSettings;
}