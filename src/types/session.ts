import type { ChromeGroupColor } from '../components/Core/TabTree/tabTreeTypes';

/** A saved tab within a session */
export interface SavedTab {
  /** UUID generated at save time (not a Chrome tab ID) */
  id: string;
  title: string;
  url: string;
  favIconUrl?: string;
}

/** A saved tab group within a session */
export interface SavedTabGroup {
  /** UUID generated at save time */
  id: string;
  title: string;
  color: ChromeGroupColor;
  tabs: SavedTab[];
}

/** Icons available for profile sessions */
export const profileIcons = [
  'briefcase', 'home', 'code', 'book', 'gamepad',
  'music', 'coffee', 'globe', 'star', 'heart',
] as const;
export type ProfileIcon = typeof profileIcons[number];

/** A complete saved session snapshot */
export interface Session {
  /** UUID generated at creation */
  id: string;
  /** User-provided name */
  name: string;
  /** ISO 8601 date string */
  createdAt: string;
  /** ISO 8601 date string */
  updatedAt: string;
  /** Tab groups in this session */
  groups: SavedTabGroup[];
  /** Ungrouped tabs in this session */
  ungroupedTabs: SavedTab[];
  /** If true, this session is pinned as a profile */
  isPinned: boolean;
  /** If true, the profile auto-syncs on window close (step 4d) — stored but not yet active */
  autoSync: boolean;
  /** Optional icon for profile sessions */
  icon?: ProfileIcon;
}
