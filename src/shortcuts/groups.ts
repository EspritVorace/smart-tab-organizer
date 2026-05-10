/**
 * Group descriptors for the help panel. Owns the visual hierarchy
 * (top-level vs nested), the per-surface filtering (popup vs options) and the
 * conditional open-by-default rules. Combined with `SHORTCUTS_REGISTRY`, these
 * descriptors fully describe what the panel renders without the panel having
 * to know about specific scopes or groups.
 */

import type { ShortcutGroupId } from './types';

export type PageContext =
  | 'home'
  | 'rules'
  | 'sessions'
  | 'importexport'
  | 'stats'
  | 'settings'
  | 'workspaces';

export type Surface = 'popup' | 'options';

export interface ShortcutGroupDescriptor {
  id: ShortcutGroupId;
  titleKey: string;
  /** Subgroup IDs nested visually inside this group on the rendered tree. */
  subgroupIds?: ShortcutGroupId[];
  /** True when this group can appear at the top level of the panel. */
  topLevel: boolean;
}

export const GROUP_DESCRIPTORS: Record<ShortcutGroupId, ShortcutGroupDescriptor> = {
  global: { id: 'global', titleKey: 'shortcutsGroupGlobal', topLevel: true },
  options: { id: 'options', titleKey: 'shortcutsGroupOptions', topLevel: true },
  popup: { id: 'popup', titleKey: 'shortcutsGroupPopup', topLevel: true },
  'list-home': {
    id: 'list-home',
    titleKey: 'shortcutsGroupListHome',
    topLevel: true,
    subgroupIds: ['session-card'],
  },
  'list-rules': {
    id: 'list-rules',
    titleKey: 'shortcutsGroupListRules',
    topLevel: true,
  },
  'list-sessions': {
    id: 'list-sessions',
    titleKey: 'shortcutsGroupListSessions',
    topLevel: true,
    subgroupIds: ['session-card'],
  },
  'list-workspaces': {
    id: 'list-workspaces',
    titleKey: 'shortcutsGroupListWorkspaces',
    topLevel: true,
  },
  'session-card': {
    id: 'session-card',
    titleKey: 'shortcutsGroupSessionCard',
    topLevel: false,
  },
};

/**
 * Top-level group order on the options surface. Mirrors the historical
 * SHORTCUT_GROUPS ordering: Global, Home, Rules, Sessions, Workspaces,
 * Options, Popup.
 */
export const TOP_LEVEL_GROUP_ORDER: ShortcutGroupId[] = [
  'global',
  'list-home',
  'list-rules',
  'list-sessions',
  'list-workspaces',
  'options',
  'popup',
];

/**
 * Groups visible per surface. On `popup` the SessionCard group is shown
 * top-level (legacy POPUP_SHORTCUT_GROUPS behavior); on `options` it appears
 * nested inside Home and Sessions only.
 */
export const VISIBLE_GROUPS_BY_SURFACE: Record<Surface, ShortcutGroupId[]> = {
  popup: ['popup', 'session-card'],
  options: [
    'global',
    'list-home',
    'list-rules',
    'list-sessions',
    'list-workspaces',
    'options',
    'popup',
  ],
};

export interface DisplayGroup {
  descriptor: ShortcutGroupDescriptor;
  subgroups: ShortcutGroupDescriptor[];
}

/**
 * Builds the ordered tree of groups to render for `surface`. On `popup` the
 * SessionCard descriptor is promoted to the top level (subgroups stripped) to
 * preserve POPUP_SHORTCUT_GROUPS' flat layout. On `options` only descriptors
 * flagged `topLevel` appear at the root, with their subgroupIds resolved to
 * descriptors and filtered to the visible set.
 */
export function getDisplayTree(surface: Surface): DisplayGroup[] {
  const visible = VISIBLE_GROUPS_BY_SURFACE[surface];
  const visibleSet = new Set(visible);

  if (surface === 'popup') {
    return visible.map((id) => ({
      descriptor: GROUP_DESCRIPTORS[id],
      subgroups: [],
    }));
  }

  return TOP_LEVEL_GROUP_ORDER.filter(
    (id) => visibleSet.has(id) && GROUP_DESCRIPTORS[id].topLevel,
  ).map((id) => {
    const descriptor = GROUP_DESCRIPTORS[id];
    const subgroups = (descriptor.subgroupIds ?? []).map(
      (subId) => GROUP_DESCRIPTORS[subId],
    );
    return { descriptor, subgroups };
  });
}

/**
 * Whether a group should be expanded on first paint. Mirrors the legacy
 * `isGroupOpenByDefault` table from the deleted shortcuts.ts: Global and
 * Options always open, Popup open only in the drawer (no pageContext), the
 * list groups open only on their matching page, SessionCard opens on
 * Sessions and Home pages.
 */
export function isGroupOpenByDefault(
  groupId: ShortcutGroupId,
  pageContext?: PageContext,
): boolean {
  switch (groupId) {
    case 'global':
    case 'options':
      return true;
    case 'popup':
      return pageContext === undefined;
    case 'list-home':
      return pageContext === 'home';
    case 'list-rules':
      return pageContext === 'rules';
    case 'list-sessions':
      return pageContext === 'sessions';
    case 'list-workspaces':
      return pageContext === 'workspaces';
    case 'session-card':
      return pageContext === 'sessions' || pageContext === 'home';
    default:
      return false;
  }
}
