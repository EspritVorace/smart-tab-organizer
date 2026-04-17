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

// Interface SyncSettings qui étend les types Zod inférés
export interface SyncSettings {
  globalGroupingEnabled: boolean;
  globalDeduplicationEnabled: boolean;
  deduplicateUnmatchedDomains: boolean;
  deduplicationKeepStrategy: DeduplicationKeepStrategyValue;
  domainRules: DomainRuleSettings;
  // Notification settings
  notifyOnGrouping: boolean;
  notifyOnDeduplication: boolean;
}

// Valeurs par défaut pour SyncSettings
export const defaultSyncSettings: SyncSettings = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
  deduplicateUnmatchedDomains: false,
  deduplicationKeepStrategy: 'keep-grouped',
  domainRules: [],
  notifyOnGrouping: true,
  notifyOnDeduplication: true
};