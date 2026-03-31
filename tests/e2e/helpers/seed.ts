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
}

export interface TestSession {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  groups: TestSavedTabGroup[];
  ungroupedTabs: TestSavedTab[];
  isPinned: boolean;
  categoryId?: string | null;
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

/** Write sessions into chrome.storage.local (bypasses the UI). */
export async function seedSessions(
  context: BrowserContext,
  sessions: TestSession[],
): Promise<void> {
  const sw = await getServiceWorker(context);
  await sw.evaluate(async (data) => {
    await chrome.storage.local.set({ sessions: data });
  }, sessions as any[]);
  // Give storage event listeners time to propagate
  await new Promise(resolve => setTimeout(resolve, 100));
}

/** Remove all sessions from storage. */
export async function clearSessions(context: BrowserContext): Promise<void> {
  const sw = await getServiceWorker(context);
  await sw.evaluate(async () => {
    await chrome.storage.local.remove('sessions');
  });
  await new Promise(resolve => setTimeout(resolve, 100));
}

/** Reset onboarding/help preferences so each test starts fresh. */
export async function clearHelpPrefs(context: BrowserContext): Promise<void> {
  const sw = await getServiceWorker(context);
  await sw.evaluate(async () => {
    await chrome.storage.local.remove('sessionsHelpPrefs');
  });
}

/** Read sessions back from storage (for assertions). */
export async function getSessionsFromStorage(context: BrowserContext): Promise<TestSession[]> {
  const sw = await getServiceWorker(context);
  return (await sw.evaluate(async () => {
    const result = await chrome.storage.local.get({ sessions: [] });
    return result.sessions;
  })) as TestSession[];
}

/** Read the sessions help preferences from storage. */
export async function getHelpPrefsFromStorage(
  context: BrowserContext,
): Promise<{ sessionsIntroHidden: boolean }> {
  const sw = await getServiceWorker(context);
  return (await sw.evaluate(async () => {
    const result = await chrome.storage.local.get({
      sessionsHelpPrefs: { sessionsIntroHidden: false },
    });
    return result.sessionsHelpPrefs;
  })) as { sessionsIntroHidden: boolean };
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
