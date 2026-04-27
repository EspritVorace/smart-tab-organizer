import { storage } from 'wxt/utils/storage';
import type { DomainRuleSettings } from '@/types/syncSettings.js';
import { defaultAppSettings } from '@/types/syncSettings.js';
import type { DeduplicationKeepStrategyValue } from '@/schemas/enums.js';
import type { RuleCategory } from '@/schemas/category.js';
import type { Statistics } from '@/types/statistics.js';
import { defaultStatistics } from '@/types/statistics.js';
import type { Session } from '@/types/session.js';

// --- Sync storage items ---

export const globalGroupingEnabledItem = storage.defineItem<boolean>(
  'local:globalGroupingEnabled',
  { defaultValue: defaultAppSettings.globalGroupingEnabled },
);

export const globalDeduplicationEnabledItem = storage.defineItem<boolean>(
  'local:globalDeduplicationEnabled',
  { defaultValue: defaultAppSettings.globalDeduplicationEnabled },
);

export const deduplicateUnmatchedDomainsItem = storage.defineItem<boolean>(
  'local:deduplicateUnmatchedDomains',
  { defaultValue: defaultAppSettings.deduplicateUnmatchedDomains },
);

export const deduplicationKeepStrategyItem = storage.defineItem<DeduplicationKeepStrategyValue>(
  'local:deduplicationKeepStrategy',
  { defaultValue: defaultAppSettings.deduplicationKeepStrategy },
);

export const domainRulesItem = storage.defineItem<DomainRuleSettings>(
  'local:domainRules',
  { defaultValue: defaultAppSettings.domainRules },
);

export const categoriesItem = storage.defineItem<RuleCategory[]>(
  'local:categories',
  { defaultValue: defaultAppSettings.categories },
);

export const categoriesSeededItem = storage.defineItem<boolean>(
  'local:categoriesSeeded',
  { defaultValue: false },
);

export const notifyOnGroupingItem = storage.defineItem<boolean>(
  'local:notifyOnGrouping',
  { defaultValue: defaultAppSettings.notifyOnGrouping },
);

export const notifyOnDeduplicationItem = storage.defineItem<boolean>(
  'local:notifyOnDeduplication',
  { defaultValue: defaultAppSettings.notifyOnDeduplication },
);

// --- Local storage items ---

export const statisticsItem = storage.defineItem<Statistics>(
  'local:statistics',
  { defaultValue: defaultStatistics },
);

export const sessionsItem = storage.defineItem<Session[]>(
  'local:sessions',
  { defaultValue: [] },
);

export const popupPinnedEmptyCollapsedItem = storage.defineItem<boolean>(
  'local:popupPinnedEmptyCollapsed',
  { defaultValue: false },
);

// Map des items settings par champ (pour watchSettingsField)
export const settingsItemMap = {
  globalGroupingEnabled: globalGroupingEnabledItem,
  globalDeduplicationEnabled: globalDeduplicationEnabledItem,
  deduplicateUnmatchedDomains: deduplicateUnmatchedDomainsItem,
  deduplicationKeepStrategy: deduplicationKeepStrategyItem,
  domainRules: domainRulesItem,
  categories: categoriesItem,
  notifyOnGrouping: notifyOnGroupingItem,
  notifyOnDeduplication: notifyOnDeduplicationItem,
} as const;
