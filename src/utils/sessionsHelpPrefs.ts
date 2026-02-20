import { browser } from 'wxt/browser';

const KEY = 'sessionsHelpPrefs';

export interface SessionsHelpPrefs {
  sessionsIntroHidden: boolean;
  profileOnboardingShown: boolean;
}

const DEFAULTS: SessionsHelpPrefs = {
  sessionsIntroHidden: false,
  profileOnboardingShown: false,
};

export async function getSessionsHelpPrefs(): Promise<SessionsHelpPrefs> {
  const result = await browser.storage.local.get({ [KEY]: {} });
  return { ...DEFAULTS, ...(result[KEY] as Partial<SessionsHelpPrefs>) };
}

export async function updateSessionsHelpPrefs(
  updates: Partial<SessionsHelpPrefs>,
): Promise<void> {
  const current = await getSessionsHelpPrefs();
  await browser.storage.local.set({ [KEY]: { ...current, ...updates } });
}
