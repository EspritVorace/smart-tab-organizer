import type { DomainRule } from '@/schemas/domainRule.js';
import {
  type BadgeType,
  type DeduplicationKeepStrategyValue,
  type DefaultRestoreActionValue
} from '@/schemas/enums.js';

// Settings types that extend the Zod-inferred types.
export interface DomainRuleSetting extends DomainRule {
  enabled: boolean;
  badge?: BadgeType;
  groupingEnabled?: boolean;
}

export type DomainRuleSettings = DomainRuleSetting[];

// AppSettings shape exposed to the rest of the app.
export interface AppSettings {
  globalGroupingEnabled: boolean;
  globalDeduplicationEnabled: boolean;
  deduplicateUnmatchedDomains: boolean;
  deduplicationKeepStrategy: DeduplicationKeepStrategyValue;
  defaultRestoreAction: DefaultRestoreActionValue;
  domainRules: DomainRuleSettings;
  // Notification settings
  notifyOnGrouping: boolean;
  notifyOnDeduplication: boolean;
  notifyOnOrganize: boolean;
}

// Default values for AppSettings.
export const defaultAppSettings: AppSettings = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
  deduplicateUnmatchedDomains: false,
  deduplicationKeepStrategy: 'keep-grouped-or-new',
  defaultRestoreAction: 'current',
  domainRules: [],
  notifyOnGrouping: true,
  notifyOnDeduplication: true,
  notifyOnOrganize: true
};
