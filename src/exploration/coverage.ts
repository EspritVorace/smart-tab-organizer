import type { ExplorationProgress, EntryDisplayState, DiscoveryProvenance } from '@/types/exploration.js';
import { CATALOG, type CatalogEntry } from './catalog.js';
import { EXPLORATION_DOMAINS, type ExplorationDomain } from './domains.js';
import { isPrerequisiteMet } from './prerequisites.js';
import { phaseForCoverage, type ResolvedPhase } from './phases.js';

/**
 * The set of "discovered" ids: the union of automatic discoveries and manual
 * marks (US-A017). Prerequisite evaluation and coverage both read this set, so
 * a manually marked prerequisite unblocks its dependents just like an automatic
 * discovery.
 */
export function discoveredSet(progress: ExplorationProgress): Set<string> {
  return new Set<string>([...progress.discovered, ...progress.manuallyMarked]);
}

/**
 * Derives an entry's display state and provenance from progress, purely (no
 * storage access, no writes). Discovery always wins over the prerequisite axis:
 * a discovered entry stays discovered even if its prerequisites later regress.
 */
export function getEntryState(
  entry: CatalogEntry,
  progress: ExplorationProgress,
  discovered: ReadonlySet<string> = discoveredSet(progress),
): { state: EntryDisplayState; provenance: DiscoveryProvenance | null } {
  const auto = progress.discovered.includes(entry.id);
  const manual = progress.manuallyMarked.includes(entry.id);
  if (auto || manual) {
    let provenance: DiscoveryProvenance = 'auto';
    if (auto && manual) provenance = 'both';
    else if (manual) provenance = 'manual';
    return { state: 'discovered', provenance };
  }
  const reachable = isPrerequisiteMet(entry.prerequisites, discovered);
  return { state: reachable ? 'to-discover' : 'not-possible', provenance: null };
}

export interface DomainCoverage {
  domain: ExplorationDomain;
  discovered: number;
  total: number;
  ratio: number;
  percent: number;
}

export interface CoverageSummary {
  discovered: number;
  total: number;
  ratio: number;
  percent: number;
  phase: ResolvedPhase;
  perDomain: DomainCoverage[];
}

/**
 * Computes the flat global coverage plus per-domain ratios and the current
 * phase. Every entry counts 1, including `not-possible` ones (they sit in the
 * denominator). O(n) over the catalogue; callers memoize on `progress`.
 */
export function computeCoverage(
  progress: ExplorationProgress,
  catalog: readonly CatalogEntry[] = CATALOG,
): CoverageSummary {
  const discovered = discoveredSet(progress);

  let total = 0;
  let discoveredCount = 0;
  const perDomainCounts = new Map<ExplorationDomain, { discovered: number; total: number }>();
  for (const domain of EXPLORATION_DOMAINS) {
    perDomainCounts.set(domain, { discovered: 0, total: 0 });
  }

  for (const entry of catalog) {
    total += 1;
    const bucket = perDomainCounts.get(entry.domain);
    if (bucket) bucket.total += 1;
    if (discovered.has(entry.id)) {
      discoveredCount += 1;
      if (bucket) bucket.discovered += 1;
    }
  }

  const ratio = total > 0 ? discoveredCount / total : 0;
  const perDomain: DomainCoverage[] = EXPLORATION_DOMAINS.map((domain) => {
    const c = perDomainCounts.get(domain) ?? { discovered: 0, total: 0 };
    const r = c.total > 0 ? c.discovered / c.total : 0;
    return { domain, discovered: c.discovered, total: c.total, ratio: r, percent: Math.round(r * 100) };
  });

  return {
    discovered: discoveredCount,
    total,
    ratio,
    percent: Math.round(ratio * 100),
    phase: phaseForCoverage(ratio),
    perDomain,
  };
}
