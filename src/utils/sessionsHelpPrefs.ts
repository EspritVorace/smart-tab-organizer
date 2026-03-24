import { sessionsHelpPrefsItem } from './storageItems.js';

export interface SessionsHelpPrefs {
  sessionsIntroHidden: boolean;
  profileOnboardingShown: boolean;
}

export async function getSessionsHelpPrefs(): Promise<SessionsHelpPrefs> {
  return sessionsHelpPrefsItem.getValue();
}

export async function updateSessionsHelpPrefs(
  updates: Partial<SessionsHelpPrefs>,
): Promise<void> {
  const current = await getSessionsHelpPrefs();
  await sessionsHelpPrefsItem.setValue({ ...current, ...updates });
}
