/**
 * Seed data for sessions / profiles screenshots.
 *
 * Types are defined locally to mirror the project types exactly as read from:
 *   src/types/session.ts            → Session, SavedTab, SavedTabGroup
 *   src/components/Core/TabTree/tabTreeTypes.ts → ChromeGroupColor
 *
 * All fields come from the TypeScript interfaces; none have been invented.
 */
import type { BrowserContext } from '@playwright/test';
import { getServiceWorker } from '../helpers/screenshot-helper.js';

// ─── Local type mirrors ───────────────────────────────────────────────────────

/** Mirrors src/components/Core/TabTree/tabTreeTypes.ts → ChromeGroupColor */
type ChromeGroupColor =
  | 'grey' | 'blue' | 'red' | 'yellow' | 'green'
  | 'pink' | 'purple' | 'cyan' | 'orange';

/** Mirrors src/types/session.ts → SavedTab */
interface SavedTab {
  id: string;
  title: string;
  url: string;
  favIconUrl?: string;
}

/** Mirrors src/types/session.ts → SavedTabGroup */
interface SavedTabGroup {
  id: string;
  title: string;
  color: ChromeGroupColor;
  tabs: SavedTab[];
}

/** Mirrors src/types/session.ts → Session */
interface Session {
  id: string;
  name: string;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  updatedAt: string;
  groups: SavedTabGroup[];
  ungroupedTabs: SavedTab[];
  isPinned: boolean;
  categoryId?: string | null;
  note?: string;
}

// ─── UUID helper ──────────────────────────────────────────────────────────────

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Seed sessions ────────────────────────────────────────────────────────────

/** Snapshot 1 — "Morning Dev Session": 2 groups + ungrouped tabs */
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

/** Snapshot 2 — "Research Session": 1 group + ungrouped tab */
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
 * Profile "Work Profile" — pinned session (isPinned: true).
 * All pinned sessions act as auto-sync profiles (see src/background/profileSync.ts).
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

/** Profile "Personal Profile" — pinned session (isPinned: true). */
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
 * Conflict session — used for the restore-conflict screenshot.
 * Its groups share the same title + color as the tab groups we create in the
 * browser window during the test setup, triggering the ConflictResolutionStep.
 */
export const SESSION_FOR_CONFLICT: Session = {
  id: 'sc-session-conflict',
  name: 'Sprint 42 Snapshot',
  createdAt: '2026-03-22T10:00:00.000Z',
  updatedAt: '2026-03-22T18:00:00.000Z',
  groups: [
    {
      // Same title + color as the tab group we'll create live in the browser
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

/** All sessions for the full seed (snapshots + profiles) */
export const ALL_SESSIONS: Session[] = [
  SESSION_MORNING_DEV,
  SESSION_RESEARCH,
  PROFILE_WORK,
  PROFILE_PERSONAL,
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

/** Inject sessions into chrome.storage.local, bypassing the UI. */
export async function seedSessions(
  context: BrowserContext,
  sessions: Session[],
): Promise<void> {
  const sw = await getServiceWorker(context);
  await sw.evaluate(async (data) => {
    await chrome.storage.local.set({ sessions: data });
  }, sessions as any[]);
  await new Promise((r) => setTimeout(r, 150));
}

/** Remove all sessions from storage. */
export async function clearSessions(context: BrowserContext): Promise<void> {
  const sw = await getServiceWorker(context);
  await sw.evaluate(async () => {
    await chrome.storage.local.remove('sessions');
  });
  await new Promise((r) => setTimeout(r, 100));
}

