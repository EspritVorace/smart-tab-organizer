/**
 * Static seed data for the documentation capture scenarios.
 *
 * This module replaces the former `e2e-screenshots/fixtures/*` data files.
 * It holds only the plain data (rules, sessions, statistics, conflict
 * payloads); the actual storage seeding is performed by the shared helpers
 * `seedDomainRules`, `seedSessions`, `seedStorage` from
 * `e2e-shared/actions`. Keeping the data here lets every scenario (the
 * satellite conflict scenarios and the feature-screen scenarios) share one
 * representative dataset, byte-identical to the data the former
 * `pnpm screenshots` pipeline used.
 *
 * Types are mirrored locally (not imported from `src/`) to match the project
 * schemas exactly without coupling the e2e bundle to the app's Zod types:
 *   src/types/syncSettings.ts  -> DomainRuleSetting
 *   src/types/session.ts       -> Session, SavedTab, SavedTabGroup
 *   src/schemas/enums.ts       -> color / groupNameSource / dedup enums
 */

// --- Domain rules ----------------------------------------------------------

type ColorValue =
  | 'grey' | 'blue' | 'red' | 'yellow' | 'green'
  | 'pink' | 'purple' | 'cyan' | 'orange';

type GroupNameSourceValue =
  | 'title' | 'url' | 'manual' | 'smart'
  | 'smart_manual' | 'smart_preset' | 'smart_label';

type DeduplicationMatchModeValue = 'exact' | 'includes';

type BadgeType = 'NEW' | 'WARNING' | 'DELETED';

/** Mirrors src/types/syncSettings.ts -> DomainRuleSetting */
export interface DomainRuleSetting {
  id: string;
  domainFilter: string;
  label: string;
  titleParsingRegEx: string;
  urlParsingRegEx: string;
  groupNameSource: GroupNameSourceValue;
  deduplicationMatchMode: DeduplicationMatchModeValue;
  color?: ColorValue;
  categoryId?: string | null;
  deduplicationEnabled: boolean;
  presetId: string | null;
  enabled: boolean;
  badge?: BadgeType;
  groupingEnabled?: boolean;
}

/**
 * 6 varied rules covering the main UI states shown in the documentation:
 *  1. Preset rule (Jira-style alphanumeric ID)
 *  2. Manual domain rule (GitHub, smart_label grouping)
 *  3. Title-regex rule (Notion, title parsing)
 *  4. Smart-manual rule (Trello, "ask"-style behaviour)
 *  5. Disabled rule (Reddit, shows toggle in off state)
 *  6. Jira-pattern rule (Linear, illustrates the killer use-case)
 */
export const SCREENSHOT_RULES: DomainRuleSetting[] = [
  {
    id: 'sc-rule-jira',
    domainFilter: '*.atlassian.net',
    label: 'Jira',
    titleParsingRegEx: '\\[([A-Z]+-\\d+)\\]',
    urlParsingRegEx: 'browse/([A-Z]+-\\d+)',
    groupNameSource: 'smart_preset',
    deduplicationMatchMode: 'exact',
    deduplicationEnabled: true,
    color: 'blue',
    categoryId: 'development',
    presetId: 'alphanumeric-id',
    enabled: true,
  },
  {
    id: 'sc-rule-github',
    domainFilter: 'github.com',
    label: 'GitHub',
    titleParsingRegEx: '',
    urlParsingRegEx: '',
    groupNameSource: 'smart_label',
    deduplicationMatchMode: 'exact',
    deduplicationEnabled: true,
    color: 'grey',
    categoryId: 'development',
    presetId: null,
    enabled: true,
  },
  {
    id: 'sc-rule-notion',
    domainFilter: '*.notion.so',
    label: 'Notion',
    titleParsingRegEx: '(.+?)\\s*[-–]\\s*Notion',
    urlParsingRegEx: '',
    groupNameSource: 'title',
    deduplicationMatchMode: 'exact',
    deduplicationEnabled: true,
    color: 'purple',
    categoryId: 'productivity',
    presetId: null,
    enabled: true,
  },
  {
    id: 'sc-rule-trello',
    domainFilter: 'trello.com',
    label: 'Trello',
    titleParsingRegEx: '',
    urlParsingRegEx: '',
    groupNameSource: 'smart_manual',
    deduplicationMatchMode: 'exact',
    deduplicationEnabled: true,
    color: 'cyan',
    categoryId: 'productivity',
    presetId: null,
    enabled: true,
  },
  {
    id: 'sc-rule-reddit',
    domainFilter: 'reddit.com',
    label: 'Reddit',
    titleParsingRegEx: '',
    urlParsingRegEx: 'r/(\\w+)',
    groupNameSource: 'url',
    deduplicationMatchMode: 'includes',
    deduplicationEnabled: false,
    color: 'orange',
    categoryId: 'social',
    presetId: null,
    enabled: false,
  },
  {
    id: 'sc-rule-linear',
    domainFilter: 'linear.app',
    label: 'Linear',
    titleParsingRegEx: '',
    urlParsingRegEx: '',
    groupNameSource: 'smart_label',
    deduplicationMatchMode: 'exact',
    deduplicationEnabled: true,
    color: 'purple',
    categoryId: 'development',
    presetId: null,
    enabled: true,
  },
];

// --- Sessions --------------------------------------------------------------

/** Mirrors src/components/Core/TabTree/tabTreeTypes.ts -> ChromeGroupColor */
type ChromeGroupColor =
  | 'grey' | 'blue' | 'red' | 'yellow' | 'green'
  | 'pink' | 'purple' | 'cyan' | 'orange';

/** Mirrors src/types/session.ts -> SavedTab */
interface SavedTab {
  id: string;
  title: string;
  url: string;
  favIconUrl?: string;
}

/** Mirrors src/types/session.ts -> SavedTabGroup */
interface SavedTabGroup {
  id: string;
  title: string;
  color: ChromeGroupColor;
  tabs: SavedTab[];
}

/** Mirrors src/types/session.ts -> Session */
export interface Session {
  id: string;
  name: string;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  updatedAt: string;
  groups: SavedTabGroup[];
  ungroupedTabs: SavedTab[];
  isPinned: boolean;
  isArchived?: boolean;
  categoryId?: string | null;
  note?: string;
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Snapshot 1 - "Morning Dev Session": 2 groups + ungrouped tabs */
export const SESSION_MORNING_DEV: Session = {
  id: 'sc-session-morning-dev',
  name: 'Morning Dev Session',
  createdAt: '2026-03-25T08:30:00.000Z',
  updatedAt: '2026-03-25T12:45:00.000Z',
  groups: [
    {
      id: uuid(),
      title: 'PROJ-123',
      color: 'blue',
      tabs: [
        {
          id: uuid(),
          title: '[PROJ-123] Fix login redirect · Jira',
          url: 'https://myteam.atlassian.net/browse/PROJ-123',
        },
        {
          id: uuid(),
          title: '[PROJ-124] Update API docs · Jira',
          url: 'https://myteam.atlassian.net/browse/PROJ-124',
        },
      ],
    },
    {
      id: uuid(),
      title: 'GitHub',
      color: 'grey',
      tabs: [
        {
          id: uuid(),
          title: 'Pull requests · myorg/myrepo',
          url: 'https://github.com/myorg/myrepo/pulls',
        },
        {
          id: uuid(),
          title: 'Issues · myorg/myrepo',
          url: 'https://github.com/myorg/myrepo/issues',
        },
      ],
    },
  ],
  ungroupedTabs: [
    {
      id: uuid(),
      title: 'MDN Web Docs',
      url: 'https://developer.mozilla.org/en-US/',
    },
  ],
  isPinned: false,
  categoryId: 'development',
  note: 'Focus on PROJ-123 login fix. Check PR #42 for API changes before merging.',
};

/** Snapshot 2 - "Research Session": 1 group + ungrouped tab */
export const SESSION_RESEARCH: Session = {
  id: 'sc-session-research',
  name: 'Research Session',
  createdAt: '2026-03-24T14:00:00.000Z',
  updatedAt: '2026-03-24T17:30:00.000Z',
  groups: [
    {
      id: uuid(),
      title: 'Notion',
      color: 'purple',
      tabs: [
        {
          id: uuid(),
          title: 'Project Roadmap – Notion',
          url: 'https://www.notion.so/myworkspace/project-roadmap',
        },
        {
          id: uuid(),
          title: 'Meeting Notes – Notion',
          url: 'https://www.notion.so/myworkspace/meeting-notes',
        },
      ],
    },
  ],
  ungroupedTabs: [
    {
      id: uuid(),
      title: 'Google',
      url: 'https://www.google.com/',
    },
  ],
  isPinned: false,
  categoryId: 'productivity',
};

/**
 * Profile "Work Profile" - pinned session (isPinned: true).
 * All pinned sessions act as auto-sync profiles.
 */
export const PROFILE_WORK: Session = {
  id: 'sc-profile-work',
  name: 'Work Profile',
  createdAt: '2026-03-20T09:00:00.000Z',
  updatedAt: '2026-03-26T08:00:00.000Z',
  groups: [
    {
      id: uuid(),
      title: 'Development',
      color: 'blue',
      tabs: [
        {
          id: uuid(),
          title: '[PROJ-456] Implement dark mode · Jira',
          url: 'https://myteam.atlassian.net/browse/PROJ-456',
        },
        {
          id: uuid(),
          title: 'smart-tab-organizer · GitHub',
          url: 'https://github.com/EspritVorace/smart-tab-organizer',
        },
      ],
    },
  ],
  ungroupedTabs: [
    {
      id: uuid(),
      title: 'Gmail',
      url: 'https://mail.google.com/',
    },
  ],
  isPinned: true,
  categoryId: 'development',
};

/** Profile "Personal Profile" - pinned session (isPinned: true). */
export const PROFILE_PERSONAL: Session = {
  id: 'sc-profile-personal',
  name: 'Personal Profile',
  createdAt: '2026-03-18T18:00:00.000Z',
  updatedAt: '2026-03-25T22:00:00.000Z',
  groups: [
    {
      id: uuid(),
      title: 'Trello',
      color: 'cyan',
      tabs: [
        {
          id: uuid(),
          title: 'Personal board | Trello',
          url: 'https://trello.com/b/personal/home',
        },
      ],
    },
  ],
  ungroupedTabs: [
    {
      id: uuid(),
      title: 'Reddit',
      url: 'https://www.reddit.com/',
    },
    {
      id: uuid(),
      title: 'YouTube',
      url: 'https://www.youtube.com/',
    },
  ],
  isPinned: true,
  categoryId: null,
};

/**
 * Conflict session - used for the restore-conflict screenshot.
 * Its first group shares the same title + color ("Work", blue) as the live tab
 * group created during the restore-conflict scenario, triggering the
 * ConflictResolutionStep.
 */
export const SESSION_FOR_CONFLICT: Session = {
  id: 'sc-session-conflict',
  name: 'Sprint 42 Snapshot',
  createdAt: '2026-03-22T10:00:00.000Z',
  updatedAt: '2026-03-22T18:00:00.000Z',
  groups: [
    {
      id: uuid(),
      title: 'Work',
      color: 'blue',
      tabs: [
        {
          id: uuid(),
          title: '[PROJ-100] Backend refactor · Jira',
          url: 'https://myteam.atlassian.net/browse/PROJ-100',
        },
        {
          id: uuid(),
          title: 'Pull request #42 · GitHub',
          url: 'https://github.com/myorg/myrepo/pull/42',
        },
      ],
    },
    {
      id: uuid(),
      title: 'Research',
      color: 'purple',
      tabs: [
        {
          id: uuid(),
          title: 'RFC: New architecture – Notion',
          url: 'https://www.notion.so/myworkspace/rfc-architecture',
        },
      ],
    },
  ],
  ungroupedTabs: [],
  isPinned: false,
  categoryId: 'development',
};

/** All sessions for the full seed (snapshots + profiles). */
export const ALL_SESSIONS: Session[] = [
  SESSION_MORNING_DEV,
  SESSION_RESEARCH,
  PROFILE_WORK,
  PROFILE_PERSONAL,
];

// --- Import conflict payload ----------------------------------------------

/**
 * Returns a valid import JSON string (matching importDataSchema) that, when
 * imported on top of SCREENSHOT_RULES, produces one "new" rule (Slack), one
 * "conflicting" rule (GitHub, differing groupNameSource/color) and one
 * "identical" rule (Linear).
 */
export function buildConflictJson(): string {
  const importData = {
    note: 'Exported from work laptop, April 2026',
    domainRules: [
      {
        id: 'import-github-conflict',
        domainFilter: 'github.com',
        label: 'GitHub',
        titleParsingRegEx: '(.+?)\\s+on\\s+GitHub',
        urlParsingRegEx: '',
        groupNameSource: 'title',
        deduplicationMatchMode: 'exact',
        deduplicationEnabled: true,
        color: 'green',
        categoryId: 'development',
        presetId: null,
        enabled: true,
      },
      {
        id: 'import-slack-new',
        domainFilter: 'app.slack.com',
        label: 'Slack',
        titleParsingRegEx: '',
        urlParsingRegEx: '',
        groupNameSource: 'smart_label',
        deduplicationMatchMode: 'exact',
        deduplicationEnabled: true,
        color: 'cyan',
        categoryId: 'productivity',
        presetId: null,
        enabled: true,
      },
      {
        id: 'import-linear-identical',
        domainFilter: 'linear.app',
        label: 'Linear',
        titleParsingRegEx: '',
        urlParsingRegEx: '',
        groupNameSource: 'smart_label',
        deduplicationMatchMode: 'exact',
        deduplicationEnabled: true,
        color: 'purple',
        categoryId: 'development',
        presetId: null,
        enabled: true,
      },
    ],
  };
  return JSON.stringify(importData, null, 2);
}

// --- Statistics ------------------------------------------------------------

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Build realistic daily buckets spread over recent weeks, keyed by the same
 * rule IDs as SCREENSHOT_RULES so the "top rules" section resolves labels.
 */
function buildDailyBuckets(): Record<
  string,
  Record<string, { grouping: number; dedup: number }>
> {
  return {
    [daysAgo(0)]: {
      'sc-rule-jira': { grouping: 4, dedup: 1 },
      'sc-rule-github': { grouping: 3, dedup: 0 },
    },
    [daysAgo(1)]: {
      'sc-rule-jira': { grouping: 5, dedup: 2 },
      'sc-rule-notion': { grouping: 2, dedup: 0 },
    },
    [daysAgo(2)]: {
      'sc-rule-github': { grouping: 6, dedup: 1 },
      'sc-rule-linear': { grouping: 3, dedup: 0 },
    },
    [daysAgo(8)]: {
      'sc-rule-jira': { grouping: 3, dedup: 1 },
      'sc-rule-github': { grouping: 2, dedup: 0 },
    },
    [daysAgo(10)]: {
      'sc-rule-notion': { grouping: 1, dedup: 0 },
      'sc-rule-trello': { grouping: 2, dedup: 1 },
    },
    [daysAgo(20)]: {
      'sc-rule-jira': { grouping: 10, dedup: 3 },
      'sc-rule-github': { grouping: 8, dedup: 2 },
      'sc-rule-linear': { grouping: 5, dedup: 0 },
    },
  };
}

/**
 * Statistics object stored under the `statistics` key. Matches the shape the
 * Statistics page consumes (totals + per-day per-rule buckets + firstUsedAt).
 */
export function buildStatistics(): Record<string, unknown> {
  return {
    tabGroupsCreatedCount: 142,
    tabsDeduplicatedCount: 38,
    dailyBuckets: buildDailyBuckets(),
    firstUsedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  };
}
