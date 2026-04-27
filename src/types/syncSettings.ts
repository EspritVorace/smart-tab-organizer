import type { DomainRule } from '@/schemas/domainRule.js';
import { type BadgeType, type DeduplicationKeepStrategyValue } from '@/schemas/enums.js';
import type { RuleCategory } from '@/schemas/category.js';

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
  categories: RuleCategory[];
  // Notification settings
  notifyOnGrouping: boolean;
  notifyOnDeduplication: boolean;
}

// Valeurs par défaut pour AppSettings
export const defaultAppSettings: AppSettings = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
  deduplicateUnmatchedDomains: false,
  deduplicationKeepStrategy: 'keep-grouped-or-new',
  domainRules: [],
  categories: [],
  notifyOnGrouping: true,
  notifyOnDeduplication: true
};
