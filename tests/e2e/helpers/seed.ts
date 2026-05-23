import type { BrowserContext } from '@playwright/test';

// Minimal local types matching src/types/session.ts
export interface TestSavedTab {
  id: string;
  title: string;
  url: string;
  favIconUrl?: string;
}

export interface TestSavedTabGroup {
  id: string;
  title: string;
  color: string;
  tabs: TestSavedTab[];
  collapsed?: boolean;
}

export interface TestSession {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  groups: TestSavedTabGroup[];
  ungroupedTabs: TestSavedTab[];
  isPinned: boolean;
  isArchived?: boolean;
  categoryId?: string | null;
  note?: string;
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function getServiceWorker(context: BrowserContext) {
  let sw = context.serviceWorkers()[0];
  if (sw) return sw;

  // Service worker may have been terminated by Chrome (idle timeout between tests).
  // Wait up to 5 seconds for it to restart.
  const maxWait = 5000;
  const start = Date.now();
  while (!sw && Date.now() - start < maxWait) {
    await new Promise(resolve => setTimeout(resolve, 200));
    sw = context.serviceWorkers()[0];
  }

  if (!sw) throw new Error('Service worker not found');
  return sw;
}

/** Write sessions into chrome.storage.local, partitioning by bucket so the
 * runtime sees them in the right storage item. Flips the per-workspace
 * archive-split flag to keep the background migration idempotent.
 */
export async function seedSessions(
  context: BrowserContext,
  sessions: TestSession[],
): Promise<void> {
  const sw = await getServiceWorker(context);
  await sw.evaluate(async (data) => {
    const all = data as TestSession[];
    const pinned: TestSession[] = [];
    const active: TestSession[] = [];
    const archived: TestSession[] = [];
    for (const session of all) {
      if (session.isArchived) archived.push(session);
      else if (session.isPinned) pinned.push(session);
      else active.push(session);
    }
    await chrome.storage.local.set({
      pinnedSessions: pinned,
      sessions: active,
      archivedSessions: archived,
      sessionsArchiveSplitDone: true,
    });
  }, sessions as any[]);
  // Give storage event listeners time to propagate
  await new Promise(resolve => setTimeout(resolve, 100));
}

/** Remove all sessions from every bucket. */
export async function clearSessions(context: BrowserContext): Promise<void> {
  const sw = await getServiceWorker(context);
  await sw.evaluate(async () => {
    await chrome.storage.local.remove(['sessions', 'pinnedSessions', 'archivedSessions']);
  });
  await new Promise(resolve => setTimeout(resolve, 100));
}

/** Read sessions back from every bucket, concatenated in the order pinned > active > archived. */
export async function getSessionsFromStorage(context: BrowserContext): Promise<TestSession[]> {
  const sw = await getServiceWorker(context);
  return (await sw.evaluate(async () => {
    const result = await chrome.storage.local.get({
      pinnedSessions: [],
      sessions: [],
      archivedSessions: [],
    });
    return [
      ...(result.pinnedSessions as TestSession[]),
      ...(result.sessions as TestSession[]),
      ...(result.archivedSessions as TestSession[]),
    ];
  })) as TestSession[];
}

/** Create a snapshot session fixture with realistic data. */
export function createTestSession(overrides: Partial<TestSession> = {}): TestSession {
  return {
    id: uuid(),
    name: 'Test Session',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    groups: [
      {
        id: uuid(),
        title: 'Work',
        color: 'blue',
        tabs: [
          { id: uuid(), title: 'Example', url: 'https://example.com' },
          { id: uuid(), title: 'Google', url: 'https://google.com' },
        ],
      },
    ],
    ungroupedTabs: [
      { id: uuid(), title: 'GitHub', url: 'https://github.com' },
    ],
    isPinned: false,
    ...overrides,
  };
}

/** Create a pinned session fixture. */
export function createPinnedSession(overrides: Partial<TestSession> = {}): TestSession {
  return createTestSession({
    name: 'Pinned Session',
    isPinned: true,
    ...overrides,
  });
}
