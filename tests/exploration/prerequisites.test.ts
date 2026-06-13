import { describe, it, expect } from 'vitest';
import {
  isPrerequisiteMet,
  describeMissing,
  prerequisiteLeafIds,
  type Prerequisite,
} from '../../src/exploration/prerequisites';

const set = (...ids: string[]) => new Set(ids);

describe('isPrerequisiteMet', () => {
  it('treats an absent prerequisite as satisfied', () => {
    expect(isPrerequisiteMet(undefined, set())).toBe(true);
  });

  it('evaluates a leaf against the discovered set', () => {
    expect(isPrerequisiteMet('a', set('a'))).toBe(true);
    expect(isPrerequisiteMet('a', set('b'))).toBe(false);
  });

  it('evaluates allOf (AND)', () => {
    const p: Prerequisite = { allOf: ['a', 'b'] };
    expect(isPrerequisiteMet(p, set('a', 'b'))).toBe(true);
    expect(isPrerequisiteMet(p, set('a'))).toBe(false);
  });

  it('evaluates anyOf (OR) - central rules.edit case', () => {
    const p: Prerequisite = { anyOf: ['grouping.create', 'packs.apply'] };
    expect(isPrerequisiteMet(p, set('grouping.create'))).toBe(true);
    expect(isPrerequisiteMet(p, set('packs.apply'))).toBe(true);
    expect(isPrerequisiteMet(p, set())).toBe(false);
  });

  it('evaluates nested expressions', () => {
    const p: Prerequisite = { allOf: ['x', { anyOf: ['a', 'b'] }] };
    expect(isPrerequisiteMet(p, set('x', 'b'))).toBe(true);
    expect(isPrerequisiteMet(p, set('x'))).toBe(false);
    expect(isPrerequisiteMet(p, set('a', 'b'))).toBe(false);
  });
});

describe('describeMissing', () => {
  it('returns null when already satisfied', () => {
    expect(describeMissing('a', set('a'))).toBeNull();
    expect(describeMissing({ anyOf: ['a', 'b'] }, set('a'))).toBeNull();
  });

  it('reports a missing leaf', () => {
    expect(describeMissing('a', set())).toEqual({ kind: 'leaf', id: 'a' });
  });

  it('reports all missing branches of an unsatisfied anyOf', () => {
    expect(describeMissing({ anyOf: ['a', 'b'] }, set())).toEqual({
      kind: 'anyOf',
      parts: [
        { kind: 'leaf', id: 'a' },
        { kind: 'leaf', id: 'b' },
      ],
    });
  });

  it('reports only the unmet branches of an allOf', () => {
    expect(describeMissing({ allOf: ['a', 'b'] }, set('a'))).toEqual({ kind: 'leaf', id: 'b' });
  });
});

describe('prerequisiteLeafIds', () => {
  it('flattens every referenced id', () => {
    const p: Prerequisite = { allOf: ['x', { anyOf: ['a', 'b'] }] };
    expect(prerequisiteLeafIds(p).sort()).toEqual(['a', 'b', 'x']);
    expect(prerequisiteLeafIds(undefined)).toEqual([]);
  });
});
