import { storage } from 'wxt/utils/storage';
import type { SyncSettings, DomainRuleSettings } from '../types/syncSettings.js';
import { defaultSyncSettings } from '../types/syncSettings.js';
import type { Statistics } from '../types/statistics.js';
import { defaultStatistics } from '../types/statistics.js';
import type { Session } from '../types/session.js';
import type { SessionsHelpPrefs } from './sessionsHelpPrefs.js';
import type { ProfileWindowMap } from './profileWindowMap.js';
import type { SyncDraftsMap } from '../background/profileSync.js';

// --- Sync storage items ---

export const globalGroupingEnabledItem = storage.defineItem<boolean>(
  'sync:globalGroupingEnabled',
  { defaultValue: defaultSyncSettings.globalGroupingEnabled },
);

export const globalDeduplicationEnabledItem = storage.defineItem<boolean>(
  'sync:globalDeduplicationEnabled',
  { defaultValue: defaultSyncSettings.globalDeduplicationEnabled },
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

export const sessionsHelpPrefsItem = storage.defineItem<SessionsHelpPrefs>(
  'local:sessionsHelpPrefs',
  { defaultValue: { sessionsIntroHidden: false, profileOnboardingShown: false } },
);

// --- Session storage items ---

export const profileWindowMapItem = storage.defineItem<ProfileWindowMap>(
  'session:profileWindowMap',
  { defaultValue: {} },
);

export const profileSyncDraftsItem = storage.defineItem<SyncDraftsMap>(
  'session:profileSyncDrafts',
  { defaultValue: {} },
);

export const editingProfileIdItem = storage.defineItem<string | null>(
  'session:editingProfileId',
  { defaultValue: null },
);

// Map des items sync par champ (pour watchSyncSettingsField)
export const syncSettingsItemMap = {
  globalGroupingEnabled: globalGroupingEnabledItem,
  globalDeduplicationEnabled: globalDeduplicationEnabledItem,
  domainRules: domainRulesItem,
  notifyOnGrouping: notifyOnGroupingItem,
  notifyOnDeduplication: notifyOnDeduplicationItem,
} as const;
