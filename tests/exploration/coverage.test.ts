import { describe, it, expect } from 'vitest';
import {
  computeCoverage,
  getEntryState,
  discoveredSet,
  reviewPromptThreshold,
  isReviewPromptEligible,
} from '../../src/exploration/coverage';
import { phaseForCoverage } from '../../src/exploration/phases';
import type { CatalogEntry } from '../../src/exploration/catalog';
import type { ExplorationProgress } from '../../src/types/exploration';

function progress(p: Partial<ExplorationProgress> = {}): ExplorationProgress {
  return { discovered: [], manuallyMarked: [], values: {}, initializedAt: 1, ...p };
}

const tinyCatalog: CatalogEntry[] = [
  { id: 'a', domain: 'grouping', labelKey: 'a', descriptionKey: 'a', uiTarget: '#', detect: 'touchpoint' },
  { id: 'b', domain: 'grouping', labelKey: 'b', descriptionKey: 'b', uiTarget: '#', detect: 'touchpoint', prerequisites: 'a' },
  { id: 'c', domain: 'dedup', labelKey: 'c', descriptionKey: 'c', uiTarget: '#', detect: 'touchpoint' },
  { id: 'd', domain: 'dedup', labelKey: 'd', descriptionKey: 'd', uiTarget: '#', detect: 'touchpoint', prerequisites: { anyOf: ['a', 'c'] } },
];

describe('discoveredSet', () => {
  it('unions automatic and manual marks', () => {
    expect([...discoveredSet(progress({ discovered: ['a'], manuallyMarked: ['b'] }))].sort()).toEqual(['a', 'b']);
  });
});

describe('getEntryState', () => {
  const [a, b] = tinyCatalog;

  it('marks an auto-discovered entry as discovered with auto provenance', () => {
    expect(getEntryState(a, progress({ discovered: ['a'] }))).toEqual({ state: 'discovered', provenance: 'auto' });
  });

  it('marks a manual-only entry as discovered with manual provenance', () => {
    expect(getEntryState(a, progress({ manuallyMarked: ['a'] }))).toEqual({ state: 'discovered', provenance: 'manual' });
  });

  it('reports both provenance when auto and manual coincide', () => {
    expect(getEntryState(a, progress({ discovered: ['a'], manuallyMarked: ['a'] }))).toEqual({
      state: 'discovered',
      provenance: 'both',
    });
  });

  it('is to-discover when reachable and undiscovered', () => {
    expect(getEntryState(a, progress())).toEqual({ state: 'to-discover', provenance: null });
  });

  it('is not-possible when prerequisites are unmet', () => {
    expect(getEntryState(b, progress())).toEqual({ state: 'not-possible', provenance: null });
  });

  it('flips to to-discover once the prerequisite is met (auto or manual)', () => {
    expect(getEntryState(b, progress({ discovered: ['a'] })).state).toBe('to-discover');
    expect(getEntryState(b, progress({ manuallyMarked: ['a'] })).state).toBe('to-discover');
  });

  it('keeps discovery winning over a regressed prerequisite', () => {
    // b is discovered even though its prerequisite 'a' is not in the set.
    expect(getEntryState(b, progress({ discovered: ['b'] })).state).toBe('discovered');
  });
});

describe('computeCoverage', () => {
  it('computes flat coverage including not-possible entries in the denominator', () => {
    const cov = computeCoverage(progress({ discovered: ['a'] }), tinyCatalog);
    expect(cov.total).toBe(4); // b and d are not-possible but still count
    expect(cov.discovered).toBe(1);
    expect(cov.percent).toBe(25);
  });

  it('computes per-domain ratios', () => {
    const cov = computeCoverage(progress({ discovered: ['a', 'c'] }), tinyCatalog);
    const grouping = cov.perDomain.find((d) => d.domain === 'grouping')!;
    const dedup = cov.perDomain.find((d) => d.domain === 'dedup')!;
    expect(grouping).toMatchObject({ discovered: 1, total: 2, percent: 50 });
    expect(dedup).toMatchObject({ discovered: 1, total: 2, percent: 50 });
  });

  it('derives the current phase from the global ratio', () => {
    const cov = computeCoverage(progress({ discovered: ['a', 'b', 'c'] }), tinyCatalog);
    expect(cov.percent).toBe(75);
    expect(cov.phase.key).toBe('proficiency');
  });
});

describe('reviewPromptThreshold', () => {
  it('is one capability past the entry into the Maîtrise (60%) phase', () => {
    // ceil(0.6 * total) is the smallest count reaching 60%; + 1 the extra one.
    expect(reviewPromptThreshold(204)).toBe(124); // ceil(122.4) + 1
    expect(reviewPromptThreshold(200)).toBe(121); // ceil(120) + 1
    expect(reviewPromptThreshold(4)).toBe(4); // ceil(2.4) + 1
  });
});

describe('isReviewPromptEligible', () => {
  it('is false just below the threshold and true at it', () => {
    // tinyCatalog total is 4, so the threshold is 4 discovered.
    const below = computeCoverage(progress({ discovered: ['a', 'b', 'c'] }), tinyCatalog);
    expect(isReviewPromptEligible(below)).toBe(false);

    const at = computeCoverage(progress({ discovered: ['a', 'b', 'c', 'd'] }), tinyCatalog);
    expect(isReviewPromptEligible(at)).toBe(true);
  });

  it('stays eligible into the Expertise band', () => {
    const full = computeCoverage(progress({ discovered: ['a', 'b', 'c', 'd'] }), tinyCatalog);
    expect(full.phase.key).toBe('expertise');
    expect(isReviewPromptEligible(full)).toBe(true);
  });
});

describe('phaseForCoverage', () => {
  it('maps ratios to the four phases', () => {
    expect(phaseForCoverage(0).key).toBe('discovery');
    expect(phaseForCoverage(0.24).key).toBe('discovery');
    expect(phaseForCoverage(0.25).key).toBe('gettingStarted');
    expect(phaseForCoverage(0.59).key).toBe('gettingStarted');
    expect(phaseForCoverage(0.6).key).toBe('proficiency');
    expect(phaseForCoverage(0.85).key).toBe('expertise');
    expect(phaseForCoverage(1).key).toBe('expertise');
  });
});
