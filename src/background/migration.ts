import { browser, Browser } from 'wxt/browser';
import { logger } from '@/utils/logger.js';
import { DEFAULT_WORKSPACE_ID, defineWorkspaceItems, workspacesIndexItem } from '@/utils/workspaceStorage.js';
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
const LEGACY_CATEGORIES_CLEANUP_FLAG = 'legacyCategoriesCleaned';
const SESSIONS_ARCHIVE_SPLIT_FLAG = 'sessionsArchiveSplitDone';
const EXPLORATION_INIT_FLAG = 'explorationProgressInitialized';
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
 * Removes the now-obsolete category storage keys left behind by previous
 * versions. Rule categories are read-only constants loaded in memory from
 * `src/data/categories.json` (see `categoriesStore.ts`); they are no longer
 * persisted in `storage.local`. This one-time cleanup drops the legacy
 * `categories` array, its `categoriesSeeded` flag, and the
 * `unifiedCategoriesSeeded` migration flag. Idempotent: guarded by a flag in
 * storage.local; on error the flag is not set so the cleanup is retried on
 * next startup.
 */
export async function cleanupLegacyCategoriesStorage(): Promise<void> {
  try {
    const flagState = await browser.storage.local.get(LEGACY_CATEGORIES_CLEANUP_FLAG);
    if (flagState[LEGACY_CATEGORIES_CLEANUP_FLAG]) {
      logger.debug('[MIGRATION] Legacy categories storage already cleaned.');
      return;
    }

    await browser.storage.local.remove([
      'categories',
      'categoriesSeeded',
      'unifiedCategoriesSeeded',
    ]);
    await browser.storage.local.set({ [LEGACY_CATEGORIES_CLEANUP_FLAG]: true });
    logger.debug('[MIGRATION] Removed legacy categories storage keys.');
  } catch (error) {
    logger.error('[MIGRATION] Legacy categories cleanup failed, will retry on next startup:', error);
  }
}

/**
 * Ensures the global `explorationProgress` key exists with the default shape
 * and a stamped `initializedAt`. No backfill of pre-existing usage: the
 * catalogue starts empty for everyone (decision 7). Idempotent via a flag in
 * storage.local; on error the flag is not set so it retries next startup.
 */
export async function initializeExplorationProgress(): Promise<void> {
  try {
    const flagState = await browser.storage.local.get(EXPLORATION_INIT_FLAG);
    if (flagState[EXPLORATION_INIT_FLAG]) {
      logger.debug('[MIGRATION] Exploration progress already initialized.');
      return;
    }

    const existing = await browser.storage.local.get('explorationProgress');
    if (existing.explorationProgress === undefined) {
      await browser.storage.local.set({
        explorationProgress: {
          discovered: [],
          manuallyMarked: [],
          values: {},
          initializedAt: Date.now(),
        },
      });
      logger.debug('[MIGRATION] Initialized empty exploration progress.');
    }

    await browser.storage.local.set({ [EXPLORATION_INIT_FLAG]: true });
  } catch (error) {
    logger.error('[MIGRATION] Exploration progress init failed, will retry on next startup:', error);
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
