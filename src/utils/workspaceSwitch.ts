/**
 * Active-workspace switching logic, shared by every access layer so a single
 * handler drives them all (anti-duplication, per the feature brief):
 *
 * - the in-page keyboard sequences (`w n` / `w p` / `w l`) mounted in the popup
 *   and the options page,
 * - the browser manifest commands handled in the background service worker,
 * - the workspace dropdown / page (via `ActiveWorkspaceContext.switchTo`).
 *
 * Switching a workspace only flips a context pointer (rules, sessions,
 * settings, statistics scoped storage); it never moves a tab. The cycle order
 * is the fixed order of the workspaces index, wrapping around at both ends. The
 * "last used" gesture is a two-entry MRU (a single back-and-forth pointer).
 */

import {
  DEFAULT_WORKSPACE_ID,
  activeWorkspaceIdItem,
  previousWorkspaceIdItem,
  workspacesIndexItem,
} from './workspaceStorage.js';
import type { WorkspaceMeta } from '@/schemas/workspace.js';

export type WorkspaceSwitchDirection = 'next' | 'prev' | 'last';

/** Why a relative switch produced no change, used to phrase the announcement. */
export type WorkspaceSwitchSkipReason = 'single' | 'no-previous';

export interface WorkspaceSwitchOutcome {
  /** True when the active workspace actually changed. */
  switched: boolean;
  /** Workspace active after the operation (the target on success, the
   *  unchanged current one otherwise). `null` when it is not in the index. */
  active: WorkspaceMeta | null;
  /** ID active after the operation. */
  activeId: string;
  /** Present only when `switched` is false. */
  reason?: WorkspaceSwitchSkipReason;
}

/**
 * Resolve the target workspace ID for a relative move, or `null` when no move
 * is possible (a single workspace for next/prev, or no valid previous pointer
 * for last). Pure: callers pass the current index snapshot.
 */
export function computeRelativeTargetId(
  workspaces: WorkspaceMeta[],
  activeId: string,
  previousId: string | null,
  direction: WorkspaceSwitchDirection,
): string | null {
  if (direction === 'last') {
    if (!previousId || previousId === activeId) return null;
    if (!workspaces.some((w) => w.id === previousId)) return null;
    return previousId;
  }

  const count = workspaces.length;
  if (count <= 1) return null;

  const currentIndex = workspaces.findIndex((w) => w.id === activeId);
  const base = currentIndex === -1 ? 0 : currentIndex;
  const targetIndex =
    direction === 'next' ? (base + 1) % count : (base - 1 + count) % count;

  const targetId = workspaces[targetIndex].id;
  return targetId === activeId ? null : targetId;
}

/**
 * Make `targetId` the active workspace, recording the outgoing one as the
 * "previous" pointer and stamping `lastActivatedAt` on the target. No-op when
 * the target is already active. Used by every switch path so the MRU pointer
 * stays correct regardless of how the switch was triggered.
 */
export async function performWorkspaceSwitch(targetId: string): Promise<void> {
  const currentActive = (await activeWorkspaceIdItem.getValue()) ?? DEFAULT_WORKSPACE_ID;
  if (targetId === currentActive) return;

  const index = (await workspacesIndexItem.getValue()) ?? [];
  const stamped = index.map((w) =>
    w.id === targetId ? { ...w, lastActivatedAt: new Date().toISOString() } : w,
  );
  await workspacesIndexItem.setValue(stamped);
  await previousWorkspaceIdItem.setValue(currentActive);
  await activeWorkspaceIdItem.setValue(targetId);
}

/**
 * Read the current workspace state, compute the relative target and apply it.
 * Returns an outcome the UI can turn into an aria-live announcement. The single
 * entry point shared by the keyboard listener and the background command
 * handler.
 */
export async function switchWorkspaceRelative(
  direction: WorkspaceSwitchDirection,
): Promise<WorkspaceSwitchOutcome> {
  const [index, activeIdRaw, previousIdRaw] = await Promise.all([
    workspacesIndexItem.getValue(),
    activeWorkspaceIdItem.getValue(),
    previousWorkspaceIdItem.getValue(),
  ]);

  const workspaces = index ?? [];
  const activeId = activeIdRaw ?? DEFAULT_WORKSPACE_ID;
  const previousId = previousIdRaw ?? null;

  const targetId = computeRelativeTargetId(workspaces, activeId, previousId, direction);

  if (targetId === null) {
    return {
      switched: false,
      active: workspaces.find((w) => w.id === activeId) ?? null,
      activeId,
      reason: workspaces.length <= 1 ? 'single' : 'no-previous',
    };
  }

  await performWorkspaceSwitch(targetId);
  return {
    switched: true,
    active: workspaces.find((w) => w.id === targetId) ?? null,
    activeId: targetId,
  };
}
