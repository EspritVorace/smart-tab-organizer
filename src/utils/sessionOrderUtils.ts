import { arrayMove } from '@dnd-kit/helpers';
import type { Session } from '@/types/session';

/**
 * Move a session to the first position.
 */
export function moveSessionToFirst(sessions: Session[], sessionId: string): Session[] {
  const currentIndex = sessions.findIndex(s => s.id === sessionId);
  if (currentIndex <= 0) return sessions;
  return arrayMove(sessions, currentIndex, 0);
}

/**
 * Move a session to the last position.
 */
export function moveSessionToLast(sessions: Session[], sessionId: string): Session[] {
  const currentIndex = sessions.findIndex(s => s.id === sessionId);
  if (currentIndex < 0 || currentIndex === sessions.length - 1) return sessions;
  return arrayMove(sessions, currentIndex, sessions.length - 1);
}

/**
 * Move a session to the first position within its group (pinned or unpinned).
 * Returns the full recombined array: [...pinned, ...unpinned].
 */
export function moveSessionToFirstInGroup(sessions: Session[], sessionId: string): Session[] {
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return sessions;
  const pinned = sessions.filter(s => s.isPinned);
  const unpinned = sessions.filter(s => !s.isPinned);
  const group = session.isPinned ? pinned : unpinned;
  const reordered = moveSessionToFirst(group, sessionId);
  return session.isPinned ? [...reordered, ...unpinned] : [...pinned, ...reordered];
}

/**
 * Move a session to the last position within its group (pinned or unpinned).
 * Returns the full recombined array: [...pinned, ...unpinned].
 */
export function moveSessionToLastInGroup(sessions: Session[], sessionId: string): Session[] {
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return sessions;
  const pinned = sessions.filter(s => s.isPinned);
  const unpinned = sessions.filter(s => !s.isPinned);
  const group = session.isPinned ? pinned : unpinned;
  const reordered = moveSessionToLast(group, sessionId);
  return session.isPinned ? [...reordered, ...unpinned] : [...pinned, ...reordered];
}
