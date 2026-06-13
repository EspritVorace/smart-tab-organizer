import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { initializeExplorationProgress } from '../../src/background/migration';

beforeEach(() => {
  fakeBrowser.reset();
});

describe('initializeExplorationProgress', () => {
  it('creates the empty progress when storage has no explorationProgress', async () => {
    await initializeExplorationProgress();
    const state = await fakeBrowser.storage.local.get(['explorationProgress', 'explorationProgressInitialized']);
    expect(state.explorationProgress).toMatchObject({ discovered: [], manuallyMarked: [], values: {} });
    expect(state.explorationProgress.initializedAt).toBeGreaterThan(0);
    expect(state.explorationProgressInitialized).toBe(true);
  });

  it('does not backfill or overwrite existing progress', async () => {
    await fakeBrowser.storage.local.set({
      explorationProgress: { discovered: ['grouping.create'], manuallyMarked: [], values: {}, initializedAt: 123 },
    });
    await initializeExplorationProgress();
    const state = await fakeBrowser.storage.local.get('explorationProgress');
    expect(state.explorationProgress).toEqual({
      discovered: ['grouping.create'],
      manuallyMarked: [],
      values: {},
      initializedAt: 123,
    });
  });

  it('is idempotent (flag guards re-run)', async () => {
    await initializeExplorationProgress();
    await fakeBrowser.storage.local.remove('explorationProgress');
    await initializeExplorationProgress();
    const state = await fakeBrowser.storage.local.get('explorationProgress');
    // Second run is skipped by the flag, so it does not recreate the key.
    expect(state.explorationProgress).toBeUndefined();
  });
});
