import { browser } from 'wxt/browser';
import { logger } from '@/utils/logger.js';
import { categoriesItem, categoriesSeededItem } from '@/utils/storageItems.js';
import { fetchBuiltInCategories } from '@/utils/categoriesStore.js';

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
const URL_EXTRACTION_MODE_MIGRATION_FLAG = 'urlExtractionModeMigrated';

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

/**
 * Adds `urlExtractionMode = 'regex'` to legacy domain rules that lack it.
 * Idempotent: guarded by a flag in storage.local. On error the flag is not set
 * so the migration is retried on next startup.
 */
export async function migrateRulesAddUrlExtractionMode(): Promise<void> {
  try {
    const flagState = await browser.storage.local.get(URL_EXTRACTION_MODE_MIGRATION_FLAG);
    if (flagState[URL_EXTRACTION_MODE_MIGRATION_FLAG]) {
      logger.debug('[MIGRATION] urlExtractionMode already migrated.');
      return;
    }

    const stored = await browser.storage.local.get('domainRules');
    const rules = stored.domainRules;
    if (Array.isArray(rules)) {
      let changed = false;
      for (const rule of rules as Array<Record<string, unknown>>) {
        if (typeof rule.urlExtractionMode === 'undefined') {
          rule.urlExtractionMode = 'regex';
          changed = true;
        }
      }
      if (changed) {
        await browser.storage.local.set({ domainRules: rules });
        logger.debug('[MIGRATION] Added urlExtractionMode=regex to legacy rules.');
      } else {
        logger.debug('[MIGRATION] All rules already have urlExtractionMode.');
      }
    }

    await browser.storage.local.set({ [URL_EXTRACTION_MODE_MIGRATION_FLAG]: true });
  } catch (error) {
    logger.error('[MIGRATION] urlExtractionMode migration failed:', error);
  }
}

/**
 * Seeds the built-in categories from public/data/categories.json into storage.local.
 * Idempotent: guarded by categoriesSeededItem.
 * Never overwrites existing categories (safety net if the user already has customs).
 */
export async function seedBuiltInCategories(): Promise<void> {
  try {
    if (await categoriesSeededItem.getValue()) {
      logger.debug('[MIGRATION] Categories already seeded.');
      return;
    }

    const existing = await categoriesItem.getValue();
    if (!existing || existing.length === 0) {
      const builtIns = await fetchBuiltInCategories();
      await categoriesItem.setValue(builtIns);
      logger.debug(`[MIGRATION] Seeded ${builtIns.length} built-in categories.`);
    } else {
      logger.debug('[MIGRATION] Categories storage already populated, skipping seed.');
    }

    await categoriesSeededItem.setValue(true);
  } catch (error) {
    logger.error('[MIGRATION] Category seeding failed, will retry on next startup:', error);
  }
}
