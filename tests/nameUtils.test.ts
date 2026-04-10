import { describe, it, expect } from 'vitest';
import {
  generateUniqueName,
  extractName,
  createUniqueNamedCopy,
  type NamedEntity,
} from '../src/utils/nameUtils';

describe('generateUniqueName', () => {
  it('returns the base name when it is not already taken', () => {
    expect(generateUniqueName('My Rule', [], 'Copy')).toBe('My Rule');
  });

  it('returns the base name when the existing list does not contain it', () => {
    expect(generateUniqueName('My Rule', ['Other', 'Another'], 'Copy')).toBe('My Rule');
  });

  it('appends a single suffix on first collision', () => {
    expect(generateUniqueName('My Rule', ['My Rule'], 'Copy')).toBe('My Rule (Copy)');
  });

  it('appends a numbered suffix on second collision', () => {
    expect(
      generateUniqueName('My Rule', ['My Rule', 'My Rule (Copy)'], 'Copy'),
    ).toBe('My Rule (Copy 2)');
  });

  it('keeps incrementing the counter until it finds a free slot', () => {
    const existing = [
      'My Rule',
      'My Rule (Copy)',
      'My Rule (Copy 2)',
      'My Rule (Copy 3)',
    ];
    expect(generateUniqueName('My Rule', existing, 'Copy')).toBe('My Rule (Copy 4)');
  });

  it('compares existing names case-insensitively', () => {
    expect(generateUniqueName('My Rule', ['MY RULE'], 'Copy')).toBe('My Rule (Copy)');
  });

  it('matches the generated candidate case-insensitively too', () => {
    // The loop should notice "my rule (copy)" even if casing differs.
    expect(
      generateUniqueName('My Rule', ['My Rule', 'MY RULE (COPY)'], 'Copy'),
    ).toBe('My Rule (Copy 2)');
  });

  it('falls back to the i18n "copy" key when no suffix is passed', () => {
    // In test env, getMessage('copy') returns the key itself ("copy").
    expect(generateUniqueName('X', ['X'])).toBe('X (copy)');
  });

  it('accepts a custom suffix string', () => {
    expect(generateUniqueName('X', ['X'], 'Dupliqué')).toBe('X (Dupliqué)');
  });
});

describe('extractName', () => {
  it('returns the label when defined', () => {
    expect(extractName({ label: 'Label', name: 'Name' })).toBe('Label');
  });

  it('falls back to name when label is absent', () => {
    expect(extractName({ name: 'Name' })).toBe('Name');
  });

  it('returns an empty string when neither label nor name is set', () => {
    expect(extractName({})).toBe('');
  });

  it('falls back to name when label is an empty string', () => {
    expect(extractName({ label: '', name: 'Name' })).toBe('Name');
  });

  it('returns an empty string when both label and name are empty strings', () => {
    expect(extractName({ label: '', name: '' })).toBe('');
  });
});

describe('createUniqueNamedCopy', () => {
  interface TestRule extends NamedEntity {
    id: string;
    label?: string;
    name?: string;
    color?: string;
  }

  it('assigns the new id and produces a unique label', () => {
    const original: TestRule = { id: 'a', label: 'My Rule', color: 'blue' };
    const existing: TestRule[] = [original];

    const copy = createUniqueNamedCopy(original, existing, 'new-id');

    expect(copy.id).toBe('new-id');
    expect(copy.label).toBe('My Rule (copySuffix)');
    expect(copy.color).toBe('blue');
  });

  it('produces a numbered label when the first copy name is also taken', () => {
    const original: TestRule = { id: 'a', label: 'My Rule' };
    const existing: TestRule[] = [
      original,
      { id: 'b', label: 'My Rule (copySuffix)' },
    ];

    const copy = createUniqueNamedCopy(original, existing, 'new-id');

    expect(copy.label).toBe('My Rule (copySuffix 2)');
  });

  it('uses the "name" field when the entity has no label', () => {
    const original: TestRule = { id: 'a', name: 'Session A' };
    const existing: TestRule[] = [original];

    const copy = createUniqueNamedCopy(original, existing, 'new-id');

    expect(copy.name).toBe('Session A (copySuffix)');
    expect(copy.label).toBeUndefined();
  });

  it('prefers label over name when both are present and non-empty', () => {
    const original: TestRule = { id: 'a', label: 'Label', name: 'Name' };
    const existing: TestRule[] = [original];

    const copy = createUniqueNamedCopy(original, existing, 'new-id');

    expect(copy.label).toBe('Label (copySuffix)');
    expect(copy.name).toBe('Name'); // untouched
  });

  it('returns a copy whose original field is untouched', () => {
    const original: TestRule = { id: 'a', label: 'Rule', color: 'red' };
    const existing: TestRule[] = [];

    const copy = createUniqueNamedCopy(original, existing, 'new-id');

    // No collision → label unchanged
    expect(copy.label).toBe('Rule');
    expect(copy.id).toBe('new-id');
    expect(original.id).toBe('a'); // original not mutated
  });

  it('copies entities with empty existing list', () => {
    const original: TestRule = { id: 'a', label: 'Unique' };
    const copy = createUniqueNamedCopy(original, [], 'new-id');
    expect(copy.label).toBe('Unique');
    expect(copy.id).toBe('new-id');
  });
});
