import { arrayMove } from '@dnd-kit/helpers';
import type { Session } from '../types/session';

/**
 * Move a session to the first position.
 */
export function moveToFirst(sessions: Session[], sessionId: string): Session[] {
  const currentIndex = sessions.findIndex(s => s.id === sessionId);
  if (currentIndex <= 0) return sessions;
  return arrayMove(sessions, currentIndex, 0);
}

/**
 * Move a session to the last position.
 */
export function moveToLast(sessions: Session[], sessionId: string): Session[] {
  const currentIndex = sessions.findIndex(s => s.id === sessionId);
  if (currentIndex < 0 || currentIndex === sessions.length - 1) return sessions;
  return arrayMove(sessions, currentIndex, sessions.length - 1);
}
