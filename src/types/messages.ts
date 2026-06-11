// Shared message types for communication between background and content scripts

export interface MiddleClickMessage {
  type: 'middleClickLink';
  url: string;
}

export interface AskGroupNameMessage {
  type: 'askGroupName';
  defaultName: string;
}

export interface GroupNameResponse {
  name: string | null;
}

/** Outcome of an Organize run, surfaced to the UI for the immediate-reward flow. */
export interface OrganizeAllTabsResult {
  tabsGrouped: number;
  groupCount: number;
  removedCount: number;
  /** True when there was nothing to organize (no eligible tab / already organized). */
  noop: boolean;
}

export interface MessageResponse {
  status: 'received' | 'error';
  message?: string;
  organize?: OrganizeAllTabsResult;
}

export interface OrganizeAllTabsMessage {
  type: 'ORGANIZE_ALL_TABS';
}

/**
 * Same as {@link OrganizeAllTabsMessage} but resolves with the
 * {@link OrganizeAllTabsResult} so the caller (onboarding reward) can announce
 * the outcome. Kept separate to leave the fire-and-forget path untouched.
 */
export interface OrganizeAllTabsAwaitMessage {
  type: 'ORGANIZE_ALL_TABS_AWAIT';
}

export interface SessionRestoreSkipDedupMessage {
  type: 'SESSION_RESTORE_SKIP_DEDUP';
  urls: string[];
}

// Union types for different contexts
export type ContentMessage = MiddleClickMessage | AskGroupNameMessage;
export type BackgroundMessage =
  | MiddleClickMessage
  | OrganizeAllTabsMessage
  | OrganizeAllTabsAwaitMessage
  | SessionRestoreSkipDedupMessage;