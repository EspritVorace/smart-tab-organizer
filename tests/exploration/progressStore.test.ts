import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  markDiscovered,
  markValue,
  setManualMark,
  getExplorationProgress,
  initExplorationProgress,
  _resetExplorationStoreForTests,
} from '../../src/exploration/progressStore';
import { explorationProgressItem } from '../../src/utils/workspaceStorage';

beforeEach(() => {
  fakeBrowser.reset();
  _resetExplorationStoreForTests();
});

describe('initExplorationProgress', () => {
  it('stamps initializedAt without backfilling discoveries', async () => {
    await initExplorationProgress();
    const p = await getExplorationProgress();
    expect(p.discovered).toEqual([]);
    expect(p.manuallyMarked).toEqual([]);
    expect(p.initializedAt).toBeGreaterThan(0);
  });
});

describe('markDiscovered', () => {
  it('adds an id and is idempotent', async () => {
    await markDiscovered('grouping.create');
    await markDiscovered('grouping.create');
    const p = await getExplorationProgress();
    expect(p.discovered).toEqual(['grouping.create']);
  });

  it('coalesces near-simultaneous marks into one consistent write', async () => {
    await Promise.all([
      markDiscovered('a'),
      markDiscovered('b'),
      markDiscovered('a'),
    ]);
    const p = await getExplorationProgress();
    expect(p.discovered.sort()).toEqual(['a', 'b']);
  });

  it('does not orphan a mark enqueued while a flush is in flight', async () => {
    const p1 = markDiscovered('a'); // schedules the flush microtask
    await Promise.resolve(); // let the flush start and await storage I/O
    const p2 = markDiscovered('b'); // enqueued mid-flush: must not be dropped
    await Promise.all([p1, p2]);
    const p = await getExplorationProgress();
    expect(p.discovered.sort()).toEqual(['a', 'b']);
  });
});

describe('markValue', () => {
  it('dedup-adds distinct values', async () => {
    await markValue('grouping.color', 'blue');
    await markValue('grouping.color', 'blue');
    await markValue('grouping.color', 'red');
    const p = await getExplorationProgress();
    expect(p.values['grouping.color'].sort()).toEqual(['blue', 'red']);
  });
});

describe('setManualMark', () => {
  it('marks a to-discover entry and unmarks it again', async () => {
    await setManualMark('grouping.create', true);
    let p = await getExplorationProgress();
    expect(p.manuallyMarked).toContain('grouping.create');

    await setManualMark('grouping.create', false);
    p = await getExplorationProgress();
    expect(p.manuallyMarked).not.toContain('grouping.create');
  });

  it('is a no-op on a not-possible entry (prerequisites unmet)', async () => {
    // grouping.edit requires grouping.create OR packs.apply.
    await setManualMark('grouping.edit', true);
    const p = await getExplorationProgress();
    expect(p.manuallyMarked).not.toContain('grouping.edit');
  });

  it('unblocks a dependent when its prerequisite is manually marked', async () => {
    await setManualMark('grouping.create', true); // satisfies HAS_RULE for grouping.edit
    await setManualMark('grouping.edit', true);
    const p = await getExplorationProgress();
    expect(p.manuallyMarked).toContain('grouping.edit');
  });

  it('never undoes an automatic discovery', async () => {
    await markDiscovered('grouping.create');
    await setManualMark('grouping.create', false);
    const p = await getExplorationProgress();
    expect(p.discovered).toContain('grouping.create');
  });

  it('does not re-mark an already auto-discovered entry', async () => {
    await markDiscovered('grouping.create');
    await setManualMark('grouping.create', true);
    const p = await getExplorationProgress();
    expect(p.manuallyMarked).not.toContain('grouping.create');
  });
});

describe('persistence', () => {
  it('falls back to a default on a corrupt payload', async () => {
    await explorationProgressItem.setValue({ discovered: 'not-an-array' } as never);
    const p = await getExplorationProgress();
    expect(Array.isArray(p.discovered)).toBe(true);
    expect(p.discovered).toEqual([]);
  });

  it('keeps the serialized progress small (breadth, not volume)', async () => {
    for (const id of ['a', 'b', 'c', 'd', 'e']) {
      await markDiscovered(id);
    }
    const p = await getExplorationProgress();
    expect(JSON.stringify(p).length).toBeLessThan(2000);
  });
});
