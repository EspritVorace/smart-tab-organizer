/**
 * Conflict seed for the sessions-import-text-conflicts screenshot.
 *
 * buildSessionConflictJson() returns a JSON string that is a plain array
 * matching sessionsArraySchema (src/schemas/session.ts).
 *
 * The three sessions demonstrate all three classification outcomes produced by
 * classifyImportedSessions() (src/utils/sessionClassification.ts):
 *
 *   • conflicting  — same name as an existing ALL_SESSIONS entry but different
 *                    comparable properties (isPinned / categoryId)
 *   • new          — name not present in ALL_SESSIONS
 *   • identical    — all comparable properties match an existing session exactly
 *                    (isPinned, categoryId, groups by title+color+tabs.url,
 *                     ungroupedTabs by url)
 *
 * Classification key: name (case-insensitive), see sessionClassification.ts.
 *
 * IDs (session, group, tab) are static strings — they are excluded from the
 * comparison and do not need to match the seeded data.
 */

// ─── Local type mirrors ───────────────────────────────────────────────────────

type ChromeGroupColor =
  | 'grey' | 'blue' | 'red' | 'yellow' | 'green'
  | 'pink' | 'purple' | 'cyan' | 'orange';

interface SavedTab {
  id: string;
  title: string;
  url: string;
  favIconUrl?: string;
}

interface SavedTabGroup {
  id: string;
  title: string;
  color: ChromeGroupColor;
  tabs: SavedTab[];
}

interface Session {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  groups: SavedTabGroup[];
  ungroupedTabs: SavedTab[];
  isPinned: boolean;
  categoryId?: string | null;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

/**
 * Conflicting session — name "Morning Dev Session" matches SESSION_MORNING_DEV
 * in ALL_SESSIONS, but:
 *   isPinned:    true  (existing: false)   → diff detected
 *   categoryId: 'productivity' (existing: 'development') → diff detected
 * → classifies as "conflicting"
 */
const conflictingSession: Session = {
  id: 'import-morning-dev-conflict',
  name: 'Morning Dev Session',
  createdAt: '2026-03-25T08:30:00.000Z',
  updatedAt: '2026-03-27T09:00:00.000Z',
  groups: [
    {
      id: 'import-group-jira',
      title: 'PROJ-123',
      color: 'blue',
      tabs: [
        {
          id: 'import-tab-jira-1',
          title: '[PROJ-123] Fix login redirect · Jira',
          url: 'https://myteam.atlassian.net/browse/PROJ-123',
        },
        {
          id: 'import-tab-jira-2',
          title: '[PROJ-124] Update API docs · Jira',
          url: 'https://myteam.atlassian.net/browse/PROJ-124',
        },
      ],
    },
    {
      id: 'import-group-github',
      title: 'GitHub',
      color: 'grey',
      tabs: [
        {
          id: 'import-tab-gh-1',
          title: 'Pull requests · myorg/myrepo',
          url: 'https://github.com/myorg/myrepo/pulls',
        },
        {
          id: 'import-tab-gh-2',
          title: 'Issues · myorg/myrepo',
          url: 'https://github.com/myorg/myrepo/issues',
        },
      ],
    },
  ],
  ungroupedTabs: [
    {
      id: 'import-tab-mdn',
      title: 'MDN Web Docs',
      url: 'https://developer.mozilla.org/en-US/',
    },
  ],
  isPinned: true,
  categoryId: 'productivity',
};

/**
 * New session — name "Evening Chill Session" is not present in ALL_SESSIONS
 * → classifies as "new"
 */
const newSession: Session = {
  id: 'import-evening-chill-new',
  name: 'Evening Chill Session',
  createdAt: '2026-03-26T20:00:00.000Z',
  updatedAt: '2026-03-26T22:30:00.000Z',
  groups: [
    {
      id: 'import-group-media',
      title: 'Entertainment',
      color: 'orange',
      tabs: [
        {
          id: 'import-tab-yt',
          title: 'YouTube',
          url: 'https://www.youtube.com/',
        },
        {
          id: 'import-tab-reddit',
          title: 'Reddit',
          url: 'https://www.reddit.com/',
        },
      ],
    },
  ],
  ungroupedTabs: [],
  isPinned: false,
  categoryId: null,
};

/**
 * Identical session — name "Work Profile" matches PROFILE_WORK in ALL_SESSIONS.
 * All comparable properties are equal:
 *   isPinned:    true
 *   categoryId: 'development'
 *   groups:      [{ title: 'Development', color: 'blue', tabs (by url): [...] }]
 *   ungroupedTabs (by url): [{ url: 'https://mail.google.com/' }]
 * → classifies as "identical"
 */
const identicalSession: Session = {
  id: 'import-work-profile-identical', // id excluded from comparison
  name: 'Work Profile',
  createdAt: '2026-03-20T09:00:00.000Z', // createdAt excluded from comparison
  updatedAt: '2026-03-26T08:00:00.000Z', // updatedAt excluded from comparison
  groups: [
    {
      id: 'import-group-dev', // id excluded from comparison
      title: 'Development',
      color: 'blue',
      tabs: [
        {
          id: 'import-tab-jira-work',
          title: '[PROJ-456] Implement dark mode · Jira',
          url: 'https://myteam.atlassian.net/browse/PROJ-456',
        },
        {
          id: 'import-tab-sto',
          title: 'smart-tab-organizer · GitHub',
          url: 'https://github.com/EspritVorace/smart-tab-organizer',
        },
      ],
    },
  ],
  ungroupedTabs: [
    {
      id: 'import-tab-gmail',
      title: 'Gmail',
      url: 'https://mail.google.com/',
    },
  ],
  isPinned: true,
  categoryId: 'development',
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a valid sessions JSON string (matching sessionsArraySchema — a plain
 * array) that will produce one "new" session, one "conflicting" session, and
 * one "identical" session when imported on top of ALL_SESSIONS.
 */
export function buildSessionConflictJson(): string {
  const sessions: Session[] = [conflictingSession, newSession, identicalSession];
  return JSON.stringify(sessions, null, 2);
}
