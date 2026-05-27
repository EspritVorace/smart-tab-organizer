import type { Session } from '@/types/session';
import { sessionsArraySchema } from '@/schemas/session';
import { logger } from './logger.js';
import { getActiveScopedItems } from './workspaceContext.js';
import type { ScopedItems } from './workspaceStorage.js';
import { incrementSessionEvent } from './statisticsUtils.js';

/** Logical buckets sessions can live in. Each is backed by its own storage item. */
export type SessionBucket = 'pinned' | 'active' | 'archived';

function bucketOf(session: Pick<Session, 'isPinned' | 'isArchived'>): SessionBucket {
  if (session.isArchived) return 'archived';
  if (session.isPinned) return 'pinned';
  return 'active';
}

function itemFor(items: ScopedItems, bucket: SessionBucket) {
  if (bucket === 'pinned') return items.pinnedSessionsItem;
  if (bucket === 'archived') return items.archivedSessionsItem;
  return items.sessionsItem;
}

async function loadBucket(bucket: SessionBucket): Promise<Session[]> {
  try {
    const items = await getActiveScopedItems();
    const raw = await itemFor(items, bucket).getValue();
    const parsed = sessionsArraySchema.safeParse(raw);
    if (parsed.success) {
      return parsed.data as Session[];
    }
    logger.warn(`Sessions storage validation failed for bucket "${bucket}":`, parsed.error);
    return [];
  } catch (error) {
    logger.error(`Error loading sessions from bucket "${bucket}":`, error);
    return [];
  }
}

async function saveBucket(bucket: SessionBucket, sessions: Session[]): Promise<void> {
  const items = await getActiveScopedItems();
  await itemFor(items, bucket).setValue(sessions);
}

/** Load only pinned sessions (profiles). Used by the popup. */
export async function loadPinnedSessions(): Promise<Session[]> {
  return loadBucket('pinned');
}

/** Load only active (non-pinned, non-archived) sessions. */
export async function loadActiveSessions(): Promise<Session[]> {
  return loadBucket('active');
}

/** Load only archived sessions. */
export async function loadArchivedSessions(): Promise<Session[]> {
  return loadBucket('archived');
}

/**
 * Load every session in the active workspace, validated with Zod and
 * concatenated across the three buckets (pinned + active + archived).
 * Preserved for backwards compatibility with the import flow and tests.
 */
export async function loadSessions(): Promise<Session[]> {
  const [pinned, active, archived] = await Promise.all([
    loadBucket('pinned'),
    loadBucket('active'),
    loadBucket('archived'),
  ]);
  return [...pinned, ...active, ...archived];
}

/**
 * Persist a full session list, automatically partitioning items into the
 * three storage buckets according to `isPinned` / `isArchived`. Acts as a
 * facade for legacy call sites (drag and drop reorder, import wizard).
 */
export async function saveSessions(sessions: Session[]): Promise<void> {
  const pinned: Session[] = [];
  const active: Session[] = [];
  const archived: Session[] = [];
  for (const session of sessions) {
    switch (bucketOf(session)) {
      case 'pinned': pinned.push(session); break;
      case 'archived': archived.push(session); break;
      default: active.push(session); break;
    }
  }
  await Promise.all([
    saveBucket('pinned', pinned),
    saveBucket('active', active),
    saveBucket('archived', archived),
  ]);
}

/** Add a new session, routed to the correct bucket based on its flags. */
export async function addSession(session: Session): Promise<void> {
  const bucket = bucketOf(session);
  const items = await loadBucket(bucket);
  items.push(session);
  await saveBucket(bucket, items);
  await incrementSessionEvent('created');
}

/**
 * Locate a session id across all buckets and return its bucket and array.
 * Returns null when the id is not found.
 */
async function findAcrossBuckets(id: string): Promise<{ bucket: SessionBucket; sessions: Session[]; index: number } | null> {
  const buckets: SessionBucket[] = ['pinned', 'active', 'archived'];
  for (const bucket of buckets) {
    const sessions = await loadBucket(bucket);
    const index = sessions.findIndex(s => s.id === id);
    if (index !== -1) return { bucket, sessions, index };
  }
  return null;
}

/**
 * Update an existing session by ID. If `isPinned` / `isArchived` change,
 * the session is moved atomically between buckets, preserving its data and
 * appending it at the end of the destination bucket with `position`
 * normalized.
 *
 * `options.touch` defaults to true: `updatedAt` is bumped to "now". Set it
 * to false for bookkeeping moves (archive, unarchive) that must preserve
 * the real last-edit timestamp.
 */
export async function updateSession(
  id: string,
  updates: Partial<Session>,
  options: { touch?: boolean } = {},
): Promise<void> {
  const { touch = true } = options;
  const found = await findAcrossBuckets(id);
  if (!found) return;
  const existing = found.sessions[found.index];
  const merged: Session = {
    ...existing,
    ...updates,
    updatedAt: touch ? new Date().toISOString() : existing.updatedAt,
  };
  const targetBucket = bucketOf(merged);

  if (targetBucket === found.bucket) {
    const next = [...found.sessions];
    next[found.index] = merged;
    await saveBucket(found.bucket, next);
    return;
  }

  const remaining = found.sessions.filter((_, i) => i !== found.index);
  const destItems = await loadBucket(targetBucket);
  merged.position = destItems.length;
  await Promise.all([
    saveBucket(found.bucket, remaining),
    saveBucket(targetBucket, [...destItems, merged]),
  ]);
}

/** Delete a session by ID, searching every bucket. */
export async function deleteSession(id: string): Promise<void> {
  const found = await findAcrossBuckets(id);
  if (!found) return;
  await saveBucket(found.bucket, found.sessions.filter((_, i) => i !== found.index));
}

/**
 * Move a session into the archived bucket. If the session was pinned, it is
 * unpinned in the process (pin and archive are mutually exclusive).
 */
export async function archiveSession(id: string): Promise<void> {
  await updateSession(id, { isArchived: true, isPinned: false }, { touch: false });
  await incrementSessionEvent('archived');
}

/** Move a session out of the archived bucket back into the active bucket. */
export async function unarchiveSession(id: string): Promise<void> {
  await updateSession(id, { isArchived: false }, { touch: false });
}

/** Pin a session. No-op if it is currently archived. */
export async function pinSession(id: string): Promise<void> {
  const found = await findAcrossBuckets(id);
  if (!found || found.bucket === 'archived') return;
  await updateSession(id, { isPinned: true });
}

/** Unpin a session. */
export async function unpinSession(id: string): Promise<void> {
  await updateSession(id, { isPinned: false });
}

/**
 * Update positions for multiple sessions in a single storage write. The
 * `bucket` parameter scopes the update to one storage item; defaults to the
 * active bucket for backwards compatibility.
 */
export async function batchUpdateSessionPositions(
  updates: Array<{ id: string; position: number }>,
  bucket: SessionBucket = 'active',
): Promise<void> {
  const sessions = await loadBucket(bucket);
  const positionMap = new Map(updates.map(u => [u.id, u.position]));
  const updated = sessions.map(s => {
    const newPosition = positionMap.get(s.id);
    return newPosition !== undefined ? { ...s, position: newPosition } : s;
  });
  await saveBucket(bucket, updated);
}

/**
 * Save sessions in a specific order (drag and drop reordering). Operates on
 * a single bucket; sessions outside the bucket are not touched. Defaults to
 * the active bucket.
 */
export async function reorderSessions(
  orderedSessions: Session[],
  bucket: SessionBucket = 'active',
): Promise<void> {
  const sessions = await loadBucket(bucket);
  const sessionMap = new Map(sessions.map(s => [s.id, s]));
  const reordered: Session[] = [];
  for (const s of orderedSessions) {
    const full = sessionMap.get(s.id);
    if (full) reordered.push(full);
  }
  const orderedIds = new Set(orderedSessions.map(s => s.id));
  const rest = sessions.filter(s => !orderedIds.has(s.id));
  await saveBucket(bucket, [...reordered, ...rest]);
}
