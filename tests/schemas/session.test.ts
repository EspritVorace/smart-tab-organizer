import { describe, it, expect, vi } from 'vitest';
import { createSessionSchemaWithUniqueness } from '../../src/schemas/session';

vi.mock('../../src/utils/i18n.js', () => ({
  getMessage: vi.fn((key: string) => key),
}));

const makeSession = (id: string, name: string, groups: Record<string, unknown>[] = []) => ({
  id,
  name,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  groups,
  ungroupedTabs: [],
  isPinned: false,
  categoryId: null,
});

const validSession = makeSession('new-id', 'My Session');

describe('createSessionSchemaWithUniqueness', () => {
  it('accepte un nom unique (liste vide)', () => {
    const schema = createSessionSchemaWithUniqueness([]);
    const result = schema.safeParse(validSession);
    expect(result.success).toBe(true);
  });

  it('accepte un nom unique parmi des sessions existantes', () => {
    const existing = [makeSession('a', 'Work'), makeSession('b', 'Personal')];
    const schema = createSessionSchemaWithUniqueness(existing);
    const result = schema.safeParse(makeSession('c', 'Unique Name'));
    expect(result.success).toBe(true);
  });

  it('rejette un nom identique à une session existante (exact)', () => {
    const existing = [makeSession('a', 'Work')];
    const schema = createSessionSchemaWithUniqueness(existing);
    const result = schema.safeParse(makeSession('new-id', 'Work'));
    expect(result.success).toBe(false);
    const nameError = result.error?.issues.find(i => i.path.includes('name'));
    expect(nameError).toBeDefined();
    expect(nameError?.message).toBe('errorSessionNameUnique');
  });

  it('rejette un nom identique en casse différente (case-insensitive)', () => {
    const existing = [makeSession('a', 'Work')];
    const schema = createSessionSchemaWithUniqueness(existing);
    const resultLower = schema.safeParse(makeSession('new-id', 'work'));
    expect(resultLower.success).toBe(false);

    const resultUpper = schema.safeParse(makeSession('new-id', 'WORK'));
    expect(resultUpper.success).toBe(false);
  });

  it('accepte le même nom lors de l\'édition de la même session (editingSessionId)', () => {
    const existing = [makeSession('a', 'Work')];
    const schema = createSessionSchemaWithUniqueness(existing, 'a');
    const result = schema.safeParse(makeSession('a', 'Work'));
    expect(result.success).toBe(true);
  });

  it('accepte le même nom en casse différente lors de l\'édition de la même session', () => {
    const existing = [makeSession('a', 'Work')];
    const schema = createSessionSchemaWithUniqueness(existing, 'a');
    const result = schema.safeParse(makeSession('a', 'work'));
    expect(result.success).toBe(true);
  });

  it('rejette le nom d\'une autre session lors de l\'édition', () => {
    const existing = [makeSession('a', 'Work'), makeSession('b', 'Personal')];
    const schema = createSessionSchemaWithUniqueness(existing, 'a');
    const result = schema.safeParse(makeSession('a', 'Personal'));
    expect(result.success).toBe(false);
  });
});

describe('savedTabGroupSchema — collapsed field [US-S016]', () => {
  const makeGroup = (collapsed?: boolean) => ({
    id: 'group-1',
    title: 'Work',
    color: 'blue',
    tabs: [{ id: 'tab-1', title: 'Example', url: 'https://example.com' }],
    ...(collapsed !== undefined ? { collapsed } : {}),
  });

  it('accepte un groupe avec collapsed: true', () => {
    const schema = createSessionSchemaWithUniqueness([]);
    const result = schema.safeParse(makeSession('s1', 'Session', [makeGroup(true)]));
    expect(result.success).toBe(true);
  });

  it('accepte un groupe avec collapsed: false', () => {
    const schema = createSessionSchemaWithUniqueness([]);
    const result = schema.safeParse(makeSession('s1', 'Session', [makeGroup(false)]));
    expect(result.success).toBe(true);
  });

  it('accepte un groupe sans champ collapsed (retro-compatibilite)', () => {
    const schema = createSessionSchemaWithUniqueness([]);
    const result = schema.safeParse(makeSession('s1', 'Session', [makeGroup()]));
    expect(result.success).toBe(true);
  });
});
