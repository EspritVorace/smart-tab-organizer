import {
  DEFAULT_WORKSPACE_ID,
  activeWorkspaceIdItem,
  defineWorkspaceItems,
  type ScopedItems,
} from './workspaceStorage.js';
import { logger } from './logger.js';

/**
 * Module-level resolver for the active workspace, used by non-React code
 * (background event handlers, utility functions, migrations). React code
 * should consume `ActiveWorkspaceContext` instead so re-renders propagate
 * on workspace switch.
 *
 * The first call performs a one-time async load + watcher registration so
 * subsequent calls resolve synchronously from the module cache. Tests that
 * never call `initWorkspaceContext` still work: `getActiveScopedItemsSync`
 * returns the default workspace items, which point at the legacy unprefixed
 * storage keys.
 */
let activeWsId: string = DEFAULT_WORKSPACE_ID;
let initPromise: Promise<void> | null = null;
let unwatch: (() => void) | null = null;

async function load(): Promise<void> {
  try {
    activeWsId = (await activeWorkspaceIdItem.getValue()) ?? DEFAULT_WORKSPACE_ID;
    unwatch = activeWorkspaceIdItem.watch((next) => {
      activeWsId = next ?? DEFAULT_WORKSPACE_ID;
    });
  } catch (error) {
    logger.error('[workspaceContext] init failed, falling back to default:', error);
    activeWsId = DEFAULT_WORKSPACE_ID;
  }
}

export async function initWorkspaceContext(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = load();
  return initPromise;
}

export function getActiveWsIdSync(): string {
  return activeWsId;
}

export async function getActiveScopedItems(): Promise<ScopedItems> {
  await initWorkspaceContext();
  return defineWorkspaceItems(activeWsId);
}

export function getActiveScopedItemsSync(): ScopedItems {
  return defineWorkspaceItems(activeWsId);
}

/** Test-only helper. */
export function _resetWorkspaceContextForTests(): void {
  activeWsId = DEFAULT_WORKSPACE_ID;
  initPromise = null;
  if (unwatch) {
    unwatch();
    unwatch = null;
  }
}
