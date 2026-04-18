import { storage } from 'wxt/utils/storage';
import type { DomainRuleSettings } from '@/types/syncSettings.js';
import { defaultSyncSettings } from '@/types/syncSettings.js';
import type { DeduplicationKeepStrategyValue } from '@/schemas/enums.js';
import type { Statistics } from '@/types/statistics.js';
import { defaultStatistics } from '@/types/statistics.js';
import type { Session } from '@/types/session.js';

// --- Sync storage items ---

export const globalGroupingEnabledItem = storage.defineItem<boolean>(
  'sync:globalGroupingEnabled',
  { defaultValue: defaultSyncSettings.globalGroupingEnabled },
);

export const globalDeduplicationEnabledItem = storage.defineItem<boolean>(
  'sync:globalDeduplicationEnabled',
  { defaultValue: defaultSyncSettings.globalDeduplicationEnabled },
);

export const deduplicateUnmatchedDomainsItem = storage.defineItem<boolean>(
  'sync:deduplicateUnmatchedDomains',
  { defaultValue: defaultSyncSettings.deduplicateUnmatchedDomains },
);

export const deduplicationKeepStrategyItem = storage.defineItem<DeduplicationKeepStrategyValue>(
  'sync:deduplicationKeepStrategy',
  { defaultValue: defaultSyncSettings.deduplicationKeepStrategy },
);

export const domainRulesItem = storage.defineItem<DomainRuleSettings>(
  'sync:domainRules',
  { defaultValue: defaultSyncSettings.domainRules },
);

export const notifyOnGroupingItem = storage.defineItem<boolean>(
  'sync:notifyOnGrouping',
  { defaultValue: defaultSyncSettings.notifyOnGrouping },
);

export const notifyOnDeduplicationItem = storage.defineItem<boolean>(
  'sync:notifyOnDeduplication',
  { defaultValue: defaultSyncSettings.notifyOnDeduplication },
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

// Map des items sync par champ (pour watchSyncSettingsField)
export const syncSettingsItemMap = {
  globalGroupingEnabled: globalGroupingEnabledItem,
  globalDeduplicationEnabled: globalDeduplicationEnabledItem,
  deduplicateUnmatchedDomains: deduplicateUnmatchedDomainsItem,
  deduplicationKeepStrategy: deduplicationKeepStrategyItem,
  domainRules: domainRulesItem,
  notifyOnGrouping: notifyOnGroupingItem,
  notifyOnDeduplication: notifyOnDeduplicationItem,
} as const;
