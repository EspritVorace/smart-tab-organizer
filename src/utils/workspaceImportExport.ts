import { storage } from 'wxt/utils/storage';
import { browser } from 'wxt/browser';
import {
  defineWorkspaceItems,
  workspacesIndexItem,
  activeWorkspaceIdItem,
  WORKSPACE_SCOPED_KEYS,
  workspaceStorageKey,
  DEFAULT_WORKSPACE_ID,
  type ScopedItems,
} from './workspaceStorage.js';
import type { WorkspaceMeta, WorkspaceAccentColor } from '@/schemas/workspace.js';
import type { AppSettings } from '@/types/syncSettings.js';
import { defaultAppSettings } from '@/types/syncSettings.js';
import type { Statistics } from '@/types/statistics.js';
import type { Session } from '@/types/session.js';
import type { RuleCategory } from '@/schemas/category.js';
import type { ImportWorkspaceData } from '@/schemas/importExport.js';

/**
 * Snapshot of an exported workspace, with a structure mirroring
 * `importWorkspaceDataSchema`.
 */
export interface WorkspaceExportPayload {
  note?: string;
  workspace: { name: string; accentColor: WorkspaceAccentColor };
  settings: Pick<
    AppSettings,
    | 'globalGroupingEnabled'
    | 'globalDeduplicationEnabled'
    | 'deduplicateUnmatchedDomains'
    | 'deduplicationKeepStrategy'
    | 'notifyOnGrouping'
    | 'notifyOnDeduplication'
    | 'notifyOnOrganize'
  >;
  domainRules: AppSettings['domainRules'];
  categories: RuleCategory[];
  sessions: Session[];
  statistics?: Statistics;
}

async function readScopedSnapshot(items: ScopedItems): Promise<{
  settings: WorkspaceExportPayload['settings'];
  domainRules: AppSettings['domainRules'];
  categories: RuleCategory[];
  sessions: Session[];
  statistics: Statistics;
}> {
  const results = await storage.getItems([
    items.globalGroupingEnabledItem,
    items.globalDeduplicationEnabledItem,
    items.deduplicateUnmatchedDomainsItem,
    items.deduplicationKeepStrategyItem,
    items.notifyOnGroupingItem,
    items.notifyOnDeduplicationItem,
    items.notifyOnOrganizeItem,
    items.domainRulesItem,
    items.categoriesItem,
    items.sessionsItem,
    items.statisticsItem,
  ]);

  return {
    settings: {
      globalGroupingEnabled: results[0].value as boolean,
      globalDeduplicationEnabled: results[1].value as boolean,
      deduplicateUnmatchedDomains: results[2].value as boolean,
      deduplicationKeepStrategy: results[3].value as AppSettings['deduplicationKeepStrategy'],
      notifyOnGrouping: results[4].value as boolean,
      notifyOnDeduplication: results[5].value as boolean,
      notifyOnOrganize: results[6].value as boolean,
    },
    domainRules: (results[7].value as AppSettings['domainRules']) ?? [],
    categories: (results[8].value as RuleCategory[]) ?? [],
    sessions: (results[9].value as Session[]) ?? [],
    statistics: results[10].value as Statistics,
  };
}

/**
 * Build a JSON-ready snapshot of the given workspace. Statistics are included
 * only when `includeStatistics` is true (off by default to avoid bloating the
 * export with daily buckets and to leave the importing user a clean slate).
 */
export async function collectWorkspaceExport(
  workspace: WorkspaceMeta,
  options: { includeStatistics?: boolean; note?: string } = {},
): Promise<WorkspaceExportPayload> {
  const items = defineWorkspaceItems(workspace.id);
  const snapshot = await readScopedSnapshot(items);

  const payload: WorkspaceExportPayload = {
    workspace: { name: workspace.name, accentColor: workspace.accentColor },
    settings: snapshot.settings,
    domainRules: snapshot.domainRules,
    categories: snapshot.categories,
    sessions: snapshot.sessions,
  };
  if (options.note?.trim()) payload.note = options.note.trim();
  if (options.includeStatistics) payload.statistics = snapshot.statistics;
  return payload;
}

async function writeScopedSnapshot(
  items: ScopedItems,
  payload: ImportWorkspaceData,
  { includeStatistics }: { includeStatistics: boolean },
): Promise<void> {
  const writes: Parameters<typeof storage.setItems>[0] = [
    { item: items.globalGroupingEnabledItem, value: payload.settings.globalGroupingEnabled },
    { item: items.globalDeduplicationEnabledItem, value: payload.settings.globalDeduplicationEnabled },
    { item: items.deduplicateUnmatchedDomainsItem, value: payload.settings.deduplicateUnmatchedDomains },
    { item: items.deduplicationKeepStrategyItem, value: payload.settings.deduplicationKeepStrategy },
    { item: items.notifyOnGroupingItem, value: payload.settings.notifyOnGrouping },
    { item: items.notifyOnDeduplicationItem, value: payload.settings.notifyOnDeduplication },
    { item: items.notifyOnOrganizeItem, value: payload.settings.notifyOnOrganize ?? defaultAppSettings.notifyOnOrganize },
    { item: items.domainRulesItem, value: payload.domainRules as AppSettings['domainRules'] },
    { item: items.categoriesItem, value: payload.categories },
    { item: items.sessionsItem, value: payload.sessions },
  ];
  if (includeStatistics && payload.statistics) {
    writes.push({ item: items.statisticsItem, value: payload.statistics as Statistics });
  }
  await storage.setItems(writes);
}

/**
 * Replace the contents of an existing workspace with the imported payload.
 * The workspace metadata (name + color) is *not* touched here so consumers
 * can keep the user's chosen identity while only swapping the data.
 */
export async function applyWorkspaceImportToExisting(
  targetWorkspaceId: string,
  payload: ImportWorkspaceData,
  options: { includeStatistics?: boolean } = {},
): Promise<void> {
  const items = defineWorkspaceItems(targetWorkspaceId);
  await writeScopedSnapshot(items, payload, { includeStatistics: !!options.includeStatistics });
}

/**
 * Create a brand-new workspace seeded with the imported payload. The new
 * workspace becomes the active one. Returns the resulting workspace metadata.
 */
export async function applyWorkspaceImportAsNew(
  payload: ImportWorkspaceData,
  options: { includeStatistics?: boolean; nameOverride?: string } = {},
): Promise<WorkspaceMeta> {
  const now = new Date().toISOString();
  const meta: WorkspaceMeta = {
    id: crypto.randomUUID(),
    name: (options.nameOverride?.trim() || payload.workspace.name).slice(0, 40),
    accentColor: payload.workspace.accentColor,
    createdAt: now,
    updatedAt: now,
  };
  const current = (await workspacesIndexItem.getValue()) ?? [];
  await workspacesIndexItem.setValue([...current, meta]);
  await applyWorkspaceImportToExisting(meta.id, payload, options);
  await activeWorkspaceIdItem.setValue(meta.id);
  return meta;
}

/**
 * Wipe the scoped data for `wsId` (used when removing a workspace). Exposed
 * here so import flows can opt to clear stale data before applying a payload.
 * For the default workspace, individual fields are reset rather than the keys
 * removed (keys are unprefixed and shared with rollback paths).
 */
export async function clearWorkspaceData(wsId: string): Promise<void> {
  if (wsId === DEFAULT_WORKSPACE_ID) {
    // Removing the legacy unprefixed keys would break rollback for prior
    // versions of the extension; the writeScopedSnapshot path overwrites them.
    return;
  }
  const keys = WORKSPACE_SCOPED_KEYS.map((field) =>
    workspaceStorageKey(wsId, field).slice('local:'.length),
  );
  await browser.storage.local.remove(keys);
}
