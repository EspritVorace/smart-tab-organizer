import type { DomainRule } from '@/schemas/domainRule.js';
import { type BadgeType, type DeduplicationKeepStrategyValue } from '@/schemas/enums.js';

// Types Settings qui étendent les types Zod inférés
export interface DomainRuleSetting extends DomainRule {
  enabled: boolean;
  badge?: BadgeType;
  groupingEnabled?: boolean;
}

// Types pour les arrays
export type DomainRuleSettings = DomainRuleSetting[];

// Interface AppSettings qui étend les types Zod inférés
export interface AppSettings {
  globalGroupingEnabled: boolean;
  globalDeduplicationEnabled: boolean;
  deduplicateUnmatchedDomains: boolean;
  deduplicationKeepStrategy: DeduplicationKeepStrategyValue;
  domainRules: DomainRuleSettings;
  // Notification settings
  notifyOnGrouping: boolean;
  notifyOnDeduplication: boolean;
}

// Alias de compatibilité (sera supprimé au lot 3)
export type SyncSettings = AppSettings;

// Valeurs par défaut pour AppSettings
export const defaultAppSettings: AppSettings = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
  deduplicateUnmatchedDomains: false,
  deduplicationKeepStrategy: 'keep-grouped-or-new',
  domainRules: [],
  notifyOnGrouping: true,
  notifyOnDeduplication: true
};

// Alias de compatibilité (sera supprimé au lot 3)
export const defaultSyncSettings: AppSettings = defaultAppSettings;