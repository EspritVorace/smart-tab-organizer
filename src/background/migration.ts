import { browser, Browser } from 'wxt/browser';
import { logger } from '@/utils/logger.js';
import { getBuiltInCategories } from '@/utils/categoriesStore.js';
import { DEFAULT_WORKSPACE_ID, defineWorkspaceItems, workspacesIndexItem } from '@/utils/workspaceStorage.js';
import { getActiveScopedItems } from '@/utils/workspaceContext.js';
import type { WorkspaceMeta, WorkspaceAccentColor } from '@/schemas/workspace.js';
import { getMessage } from '@/utils/i18n.js';
import type { Session } from '@/types/session.js';

const SETTINGS_KEYS = [
  'globalGroupingEnabled',
  'globalDeduplicationEnabled',
  'deduplicateUnmatchedDomains',
  'deduplicationKeepStrategy',
  'domainRules',
  'notifyOnGrouping',
  'notifyOnDeduplication',
  'notifyOnOrganize',
] as const;

const MIGRATION_FLAG = 'settingsMigratedToLocal';
const URL_EXTRACTION_MODE_MIGRATION_FLAG = 'urlExtractionModeMigrated';
const FALLBACK_LABEL_MIGRATION_FLAG = 'fallbackLabelInitialized';
const WORKSPACES_MIGRATION_FLAG = 'workspacesMigrated';
const UNIFIED_CATEGORIES_MIGRATION_FLAG = 'unifiedCategoriesSeeded';
const SESSIONS_ARCHIVE_SPLIT_FLAG = 'sessionsArchiveSplitDone';
export const FIRST_RUN_REDIRECT_FLAG = 'firstRunRedirectDone';

const DEFAULT_WORKSPACE_ACCENT: WorkspaceAccentColor = 'indigo';

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
 * Initializes `fallbackLabel = label` for legacy domain rules that lack it.
 * Idempotent: guarded by a flag in storage.local. On error the flag is not set
 * so the migration is retried on next startup.
 */
export async function migrateRulesAddFallbackLabel(): Promise<void> {
  try {
    const flagState = await browser.storage.local.get(FALLBACK_LABEL_MIGRATION_FLAG);
    if (flagState[FALLBACK_LABEL_MIGRATION_FLAG]) {
      logger.debug('[MIGRATION] fallbackLabel already initialized.');
      return;
    }

    const stored = await browser.storage.local.get('domainRules');
    const rules = stored.domainRules;
    if (Array.isArray(rules)) {
      let changed = false;
      for (const rule of rules as Array<Record<string, unknown>>) {
        if (typeof rule.fallbackLabel === 'undefined' && typeof rule.label === 'string') {
          rule.fallbackLabel = rule.label;
          changed = true;
        }
      }
      if (changed) {
        await browser.storage.local.set({ domainRules: rules });
        logger.debug('[MIGRATION] Initialized fallbackLabel from label on legacy rules.');
      } else {
        logger.debug('[MIGRATION] All rules already have fallbackLabel.');
      }
    }

    await browser.storage.local.set({ [FALLBACK_LABEL_MIGRATION_FLAG]: true });
  } catch (error) {
    logger.error('[MIGRATION] fallbackLabel migration failed:', error);
  }
}

/**
 * Initializes the workspace runtime. The default workspace uses the legacy
 * unprefixed storage keys (`local:domainRules`, `local:statistics`, ...), so
 * no data moves: existing settings, sessions and statistics remain in place
 * and stay rollback-compatible with prior versions.
 *
 * The migration only ensures `local:workspaces` contains at least the default
 * workspace entry and that `local:activeWorkspaceId` points to it. Idempotent:
 * guarded by `workspacesMigrated`. Runs on both fresh installs and upgrades.
 */
export async function migrateToWorkspaces(): Promise<void> {
  try {
    const flagState = await browser.storage.local.get(WORKSPACES_MIGRATION_FLAG);
    if (flagState[WORKSPACES_MIGRATION_FLAG]) {
      logger.debug('[MIGRATION] Workspaces already initialized.');
      return;
    }

    const indexState = await browser.storage.local.get(['workspaces', 'activeWorkspaceId']);
    const toWrite: Record<string, unknown> = {};

    if (!Array.isArray(indexState.workspaces) || indexState.workspaces.length === 0) {
      const now = new Date().toISOString();
      const defaultWorkspace: WorkspaceMeta = {
        id: DEFAULT_WORKSPACE_ID,
        name: getMessage('workspaceDefaultName') || 'Default',
        accentColor: DEFAULT_WORKSPACE_ACCENT,
        createdAt: now,
        updatedAt: now,
      };
      toWrite['workspaces'] = [defaultWorkspace];
    }
    if (typeof indexState.activeWorkspaceId !== 'string') {
      toWrite['activeWorkspaceId'] = DEFAULT_WORKSPACE_ID;
    }

    if (Object.keys(toWrite).length > 0) {
      await browser.storage.local.set(toWrite);
      logger.debug(`[MIGRATION] Workspaces: wrote ${Object.keys(toWrite).length} keys.`);
    }

    await browser.storage.local.set({ [WORKSPACES_MIGRATION_FLAG]: true });
  } catch (error) {
    logger.error('[MIGRATION] Workspaces migration failed, will retry on next startup:', error);
  }
}

/**
 * On a fresh install, disables the popup so the first icon click opens the
 * Options Home page instead. The flag is written to `storage.local` to track
 * whether the redirect has been scheduled (`false`) or already used / not
 * applicable (`true`).
 *
 * - First install: write `false`, clear the popup via `action.setPopup({ popup: '' })`.
 * - Update / browser_update / shared_module_update: write `true` so existing
 *   users are never redirected.
 * - Flag already present (any value): no-op (idempotent).
 */
export async function initializeFirstRunRedirectFlag(reason: Browser.runtime.OnInstalledReason | string): Promise<void> {
  try {
    const state = await browser.storage.local.get(FIRST_RUN_REDIRECT_FLAG);
    if (state[FIRST_RUN_REDIRECT_FLAG] !== undefined) {
      logger.debug('[FIRST_RUN] Flag already set, skipping.');
      return;
    }
    if (reason === 'install') {
      await browser.storage.local.set({ [FIRST_RUN_REDIRECT_FLAG]: false });
      if (browser.action?.setPopup) {
        await browser.action.setPopup({ popup: '' });
        logger.debug('[FIRST_RUN] Fresh install: popup disabled, awaiting first click.');
      }
      return;
    }
    await browser.storage.local.set({ [FIRST_RUN_REDIRECT_FLAG]: true });
    logger.debug('[FIRST_RUN] Existing user, flag initialized to true.');
  } catch (error) {
    logger.error('[FIRST_RUN] Failed to initialize first-run redirect flag:', error);
  }
}

/**
 * Adds the built-in categories introduced after the initial seed (`generic`,
 * `communication`, `news`, `ai`) to existing installations. Appends only the
 * missing built-in IDs so any user-customized categories already in storage
 * are preserved both in content and ordering. Idempotent: guarded by a flag
 * in storage.local; on error the flag is not set so the migration is retried
 * on next startup.
 */
export async function seedUnifiedCategories(): Promise<void> {
  try {
    const flagState = await browser.storage.local.get(UNIFIED_CATEGORIES_MIGRATION_FLAG);
    if (flagState[UNIFIED_CATEGORIES_MIGRATION_FLAG]) {
      logger.debug('[MIGRATION] Unified categories already seeded.');
      return;
    }

    const { categoriesItem } = await getActiveScopedItems();
    const existing = (await categoriesItem.getValue()) ?? [];
    if (existing.length === 0) {
      logger.debug('[MIGRATION] Categories storage empty, skipping unified seed (initial seed will handle it).');
      await browser.storage.local.set({ [UNIFIED_CATEGORIES_MIGRATION_FLAG]: true });
      return;
    }

    const builtIns = getBuiltInCategories();
    const existingIds = new Set(existing.map((c) => c.id));
    const toAppend = builtIns.filter((c) => !existingIds.has(c.id));

    if (toAppend.length > 0) {
      await categoriesItem.setValue([...existing, ...toAppend]);
      logger.debug(`[MIGRATION] Appended ${toAppend.length} new built-in categories: ${toAppend.map((c) => c.id).join(', ')}`);
    } else {
      logger.debug('[MIGRATION] No new built-in categories to append.');
    }

    await browser.storage.local.set({ [UNIFIED_CATEGORIES_MIGRATION_FLAG]: true });
  } catch (error) {
    logger.error('[MIGRATION] Unified categories seeding failed, will retry on next startup:', error);
  }
}

/**
 * Seeds the built-in categories from src/data/categories.json into storage.local.
 * Idempotent: guarded by categoriesSeededItem.
 * Never overwrites existing categories (safety net if the user already has customs).
 */
export async function seedBuiltInCategories(): Promise<void> {
  try {
    const { categoriesItem, categoriesSeededItem } = await getActiveScopedItems();
    if (await categoriesSeededItem.getValue()) {
      logger.debug('[MIGRATION] Categories already seeded.');
      return;
    }

    const existing = await categoriesItem.getValue();
    if (!existing || existing.length === 0) {
      const builtIns = getBuiltInCategories();
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

function archiveSplitFlagKey(wsId: string): string {
  return wsId === DEFAULT_WORKSPACE_ID
    ? SESSIONS_ARCHIVE_SPLIT_FLAG
    : `ws:${wsId}:${SESSIONS_ARCHIVE_SPLIT_FLAG}`;
}

/**
 * Splits the legacy `sessions` array into three workspace-scoped buckets:
 * `pinnedSessions`, `sessions` (active non-pinned, non-archived), and
 * `archivedSessions`. Idempotent per workspace via a dedicated flag.
 * Preserves item identity and renormalizes `position` per bucket.
 * Runs after `migrateToWorkspaces` so the workspaces index is reliable.
 */
export async function migrateSessionsSplitByPinAndArchive(): Promise<void> {
  try {
    const wsList = (await workspacesIndexItem.getValue()) ?? [];
    const wsIds = wsList.length > 0 ? wsList.map((w) => w.id) : [DEFAULT_WORKSPACE_ID];

    for (const wsId of wsIds) {
      const flagKey = archiveSplitFlagKey(wsId);
      const flagState = await browser.storage.local.get(flagKey);
      if (flagState[flagKey]) {
        logger.debug(`[MIGRATION] Sessions archive split already done for workspace "${wsId}".`);
        continue;
      }

      const items = defineWorkspaceItems(wsId);
      const all: Session[] = (await items.sessionsItem.getValue()) ?? [];

      const pinned: Session[] = [];
      const active: Session[] = [];
      const archived: Session[] = [];
      for (const session of all) {
        if (session.isArchived) archived.push(session);
        else if (session.isPinned) pinned.push(session);
        else active.push(session);
      }

      const normalize = (list: Session[]): Session[] =>
        list.map((s, i) => ({ ...s, position: i }));

      await Promise.all([
        items.pinnedSessionsItem.setValue(normalize(pinned)),
        items.archivedSessionsItem.setValue(normalize(archived)),
        items.sessionsItem.setValue(normalize(active)),
      ]);

      await browser.storage.local.set({ [flagKey]: true });
      logger.debug(
        `[MIGRATION] Sessions archive split done for workspace "${wsId}": ${pinned.length} pinned, ${active.length} active, ${archived.length} archived.`,
      );
    }
  } catch (error) {
    logger.error('[MIGRATION] Sessions archive split failed, will retry on next startup:', error);
  }
}
