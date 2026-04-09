import { arrayMove } from '@dnd-kit/helpers';
import type { Session } from '../types/session';

/**
 * Assign sequential positions to sessions that don't have one.
 * Used during migration and when creating new sessions.
 */
export function assignPositions(sessions: Session[]): Session[] {
  return sessions.map((session, index) => ({
    ...session,
    position: session.position ?? index,
  }));
}

/**
 * Get the next position to use for a new session.
 * Adds a position one past the current last position.
 */
export function getPositionForNewSession(sessions: Session[]): number {
  if (sessions.length === 0) return 0;
  const maxPosition = Math.max(...sessions.map(s => s.position ?? 0));
  return maxPosition + 1;
}

/**
 * Move a session to the first position.
 * Adjusts other positions accordingly.
 */
export function moveToFirst(sessions: Session[], sessionId: string): Session[] {
  const currentIndex = sessions.findIndex(s => s.id === sessionId);
  if (currentIndex <= 0) return sessions;
  return arrayMove(sessions, currentIndex, 0).map((session, index) => ({
    ...session,
    position: index,
  }));
}

/**
 * Move a session to the last position.
 */
export function moveToLast(sessions: Session[], sessionId: string): Session[] {
  const currentIndex = sessions.findIndex(s => s.id === sessionId);
  if (currentIndex < 0 || currentIndex === sessions.length - 1) return sessions;
  return arrayMove(sessions, currentIndex, sessions.length - 1).map((session, index) => ({
    ...session,
    position: index,
  }));
}

/**
 * Apply a drag reorder operation.
 * Handles reordering when a session is dragged from one position to another.
 */
export function applyDragReorder(
  sessions: Session[],
  activeId: string,
  overId: string,
): Session[] {
  const activeIndex = sessions.findIndex(s => s.id === activeId);
  const overIndex = sessions.findIndex(s => s.id === overId);

  if (activeIndex < 0 || overIndex < 0) return sessions;
  if (activeIndex === overIndex) return sessions;

  return arrayMove(sessions, activeIndex, overIndex).map((session, index) => ({
    ...session,
    position: index,
  }));
}
