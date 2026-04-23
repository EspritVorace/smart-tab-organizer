import { browser } from 'wxt/browser';
import { logger } from '@/utils/logger.js';

const SETTINGS_KEYS = [
  'globalGroupingEnabled',
  'globalDeduplicationEnabled',
  'deduplicateUnmatchedDomains',
  'deduplicationKeepStrategy',
  'domainRules',
  'notifyOnGrouping',
  'notifyOnDeduplication',
] as const;

const MIGRATION_FLAG = 'settingsMigratedToLocal';

/**
 * Copies settings from storage.sync into storage.local once per installation.
 * Idempotent: guarded by a flag in storage.local.
 * Never deletes storage.sync data so the user can rollback to the previous version.
 * On error, the flag is not set so the migration is retried on next startup.
 */
export async function migrateSettingsFromSyncToLocal(): Promise<void> {
  try {
    const localState = await browser.storage.local.get(MIGRATION_FLAG);
    if (localState[MIGRATION_FLAG]) {
      logger.debug('[MIGRATION] Settings already migrated to local.');
      return;
    }

    const syncData = await browser.storage.sync.get([...SETTINGS_KEYS]);
    const localData = await browser.storage.local.get([...SETTINGS_KEYS]);

    const toWrite: Record<string, unknown> = {};
    for (const key of SETTINGS_KEYS) {
      if (syncData[key] !== undefined && localData[key] === undefined) {
        toWrite[key] = syncData[key];
        logger.debug(`[MIGRATION] Copying "${key}" from sync to local.`);
      }
    }

    if (Object.keys(toWrite).length > 0) {
      await browser.storage.local.set(toWrite);
    } else {
      logger.debug('[MIGRATION] Nothing to migrate (fresh install or sync was empty).');
    }

    await browser.storage.local.set({ [MIGRATION_FLAG]: true });
    logger.debug('[MIGRATION] Migration complete.');
  } catch (error) {
    logger.error('[MIGRATION] Migration failed, will retry on next startup:', error);
  }
}
