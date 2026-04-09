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
  /** Optional category ID (from RULE_CATEGORIES) */
  categoryId?: string | null;
  /** Optional free-text note associated with the session */
  note?: string;
  /** Display order (lower index = first); assigned automatically if missing */
  position?: number;
}
