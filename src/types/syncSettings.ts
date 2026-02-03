import type { DomainRule } from '../schemas/domainRule.js';
import { type BadgeType } from '../schemas/enums.js';

// Types Settings qui étendent les types Zod inférés
export interface DomainRuleSetting extends DomainRule {
  enabled: boolean;
  badge?: BadgeType;
}

// Types pour les arrays
export type DomainRuleSettings = DomainRuleSetting[];

// Interface SyncSettings qui étend les types Zod inférés
export interface SyncSettings {
  globalGroupingEnabled: boolean;
  globalDeduplicationEnabled: boolean;
  domainRules: DomainRuleSettings;
}

// Valeurs par défaut pour SyncSettings
export const defaultSyncSettings: SyncSettings = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
  domainRules: []
};