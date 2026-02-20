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
  autoSync: boolean;
  icon?: string;
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getServiceWorker(context: BrowserContext) {
  const sw = context.serviceWorkers()[0];
  if (!sw) throw new Error('Service worker not found');
  return sw;
}

/** Write sessions into chrome.storage.local (bypasses the UI). */
export async function seedSessions(
  context: BrowserContext,
  sessions: TestSession[],
): Promise<void> {
  const sw = getServiceWorker(context);
  await sw.evaluate(async (data) => {
    await chrome.storage.local.set({ sessions: data });
  }, sessions as any[]);
  // Give storage event listeners time to propagate
  await new Promise(resolve => setTimeout(resolve, 100));
}

/** Remove all sessions from storage. */
export async function clearSessions(context: BrowserContext): Promise<void> {
  const sw = getServiceWorker(context);
  await sw.evaluate(async () => {
    await chrome.storage.local.remove('sessions');
  });
  await new Promise(resolve => setTimeout(resolve, 100));
}

/** Reset onboarding/help preferences so each test starts fresh. */
export async function clearHelpPrefs(context: BrowserContext): Promise<void> {
  const sw = getServiceWorker(context);
  await sw.evaluate(async () => {
    await chrome.storage.local.remove('sessionsHelpPrefs');
  });
}

/** Read sessions back from storage (for assertions). */
export async function getSessionsFromStorage(context: BrowserContext): Promise<TestSession[]> {
  const sw = getServiceWorker(context);
  return (await sw.evaluate(async () => {
    const result = await chrome.storage.local.get({ sessions: [] });
    return result.sessions;
  })) as TestSession[];
}

/** Read the sessions help preferences from storage. */
export async function getHelpPrefsFromStorage(
  context: BrowserContext,
): Promise<{ sessionsIntroHidden: boolean; profileOnboardingShown: boolean }> {
  const sw = getServiceWorker(context);
  return (await sw.evaluate(async () => {
    const result = await chrome.storage.local.get({
      sessionsHelpPrefs: { sessionsIntroHidden: false, profileOnboardingShown: false },
    });
    return result.sessionsHelpPrefs;
  })) as { sessionsIntroHidden: boolean; profileOnboardingShown: boolean };
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
    autoSync: false,
    ...overrides,
  };
}

/** Create a profile (pinned session) fixture. */
export function createTestProfile(overrides: Partial<TestSession> = {}): TestSession {
  return createTestSession({
    name: 'Test Profile',
    isPinned: true,
    icon: 'briefcase',
    ...overrides,
  });
}

/** Seed profile-window mapping in chrome.storage.session. */
export async function seedProfileWindow(
  context: BrowserContext,
  profileId: string,
  windowId: number,
): Promise<void> {
  const sw = getServiceWorker(context);
  await sw.evaluate(
    async ({ pid, wid }) => {
      const data = await (chrome.storage as any).session.get('profileWindowMap');
      const map = data.profileWindowMap ?? {};
      map[pid] = wid;
      await (chrome.storage as any).session.set({ profileWindowMap: map });
    },
    { pid: profileId, wid: windowId },
  );
}

/** Get the profile-window mapping from chrome.storage.session. */
export async function getProfileWindowMap(
  context: BrowserContext,
): Promise<Record<string, number>> {
  const sw = getServiceWorker(context);
  return (await sw.evaluate(async () => {
    const data = await (chrome.storage as any).session.get('profileWindowMap');
    return data.profileWindowMap ?? {};
  })) as Record<string, number>;
}
