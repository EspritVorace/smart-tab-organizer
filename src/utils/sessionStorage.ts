import type { Session } from '../types/session';
import { sessionsArraySchema } from '../schemas/session';
import { logger } from './logger.js';
import { sessionsItem } from './storageItems.js';

/** Load all sessions from storage, validated with Zod */
export async function loadSessions(): Promise<Session[]> {
  try {
    const raw = await sessionsItem.getValue();
    const parsed = sessionsArraySchema.safeParse(raw);
    if (parsed.success) {
      return parsed.data as Session[];
    }
    logger.warn('Sessions storage validation failed:', parsed.error);
    return [];
  } catch (error) {
    logger.error('Error loading sessions:', error);
    return [];
  }
}

/** Save all sessions to storage */
export async function saveSessions(sessions: Session[]): Promise<void> {
  await sessionsItem.setValue(sessions);
}

/** Add a new session */
export async function addSession(session: Session): Promise<void> {
  const sessions = await loadSessions();
  sessions.push(session);
  await saveSessions(sessions);
}

/** Update an existing session by ID */
export async function updateSession(id: string, updates: Partial<Session>): Promise<void> {
  const sessions = await loadSessions();
  const index = sessions.findIndex(s => s.id === id);
  if (index === -1) return;
  sessions[index] = { ...sessions[index], ...updates, updatedAt: new Date().toISOString() };
  await saveSessions(sessions);
}

/** Delete a session by ID */
export async function deleteSession(id: string): Promise<void> {
  const sessions = await loadSessions();
  await saveSessions(sessions.filter(s => s.id !== id));
}

/** Update positions for multiple sessions in a single storage write (avoids race conditions) */
export async function batchUpdateSessionPositions(updates: Array<{ id: string; position: number }>): Promise<void> {
  const sessions = await loadSessions();
  const positionMap = new Map(updates.map(u => [u.id, u.position]));
  const updated = sessions.map(s => {
    const newPosition = positionMap.get(s.id);
    return newPosition !== undefined ? { ...s, position: newPosition } : s;
  });
  await saveSessions(updated);
}
