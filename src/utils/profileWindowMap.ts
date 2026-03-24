import { profileWindowMapItem } from './storageItems.js';

/** Map from profileId → windowId, stored ephemerally for the browser session. */
export type ProfileWindowMap = Record<string, number>;

export async function getProfileWindowMap(): Promise<ProfileWindowMap> {
  return profileWindowMapItem.getValue();
}

/** Associate a profile with a window. Enforces one profile per window. */
export async function setProfileWindow(profileId: string, windowId: number): Promise<void> {
  const map = await profileWindowMapItem.getValue();
  // Remove any existing profile that was previously associated with this window
  for (const pid of Object.keys(map)) {
    if (map[pid] === windowId) delete map[pid];
  }
  map[profileId] = windowId;
  await profileWindowMapItem.setValue(map);
}

/** Remove the association for a profile (e.g. on unpin or delete). */
export async function removeProfileWindow(profileId: string): Promise<void> {
  const map = await profileWindowMapItem.getValue();
  if (!(profileId in map)) return;
  delete map[profileId];
  await profileWindowMapItem.setValue(map);
}

/** Remove all profiles associated with a given window (called on windows.onRemoved). */
export async function removeWindowAssociations(windowId: number): Promise<void> {
  const map = await profileWindowMapItem.getValue();
  let changed = false;
  for (const pid of Object.keys(map)) {
    if (map[pid] === windowId) {
      delete map[pid];
      changed = true;
    }
  }
  if (changed) await profileWindowMapItem.setValue(map);
}

/** Returns the windowId associated with a profile, or null if not open. */
export async function getWindowForProfile(profileId: string): Promise<number | null> {
  const map = await profileWindowMapItem.getValue();
  return map[profileId] ?? null;
}

/** Returns the profileId associated with a window, or null if none. */
export async function getProfileForWindow(windowId: number): Promise<string | null> {
  const map = await profileWindowMapItem.getValue();
  for (const [pid, wid] of Object.entries(map)) {
    if (wid === windowId) return pid;
  }
  return null;
}

export async function isProfileOpen(profileId: string): Promise<boolean> {
  return (await getWindowForProfile(profileId)) !== null;
}
