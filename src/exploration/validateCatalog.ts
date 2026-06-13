import { CATALOG, type CatalogEntry } from './catalog.js';
import { isExplorationDomain } from './domains.js';
import { prerequisiteLeafIds } from './prerequisites.js';

export interface CatalogValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * Validates the catalogue's structural invariants (US-A010):
 * no duplicate id, every domain valid, every id referenced in a prerequisite
 * exists, and no prerequisite cycle. i18n resolvability is not checked here
 * (it depends on the runtime locale catalog); it is covered by the i18n tests.
 *
 * Pure: returns the result instead of throwing, so both the boot guard (which
 * logs) and the unit tests (which assert) can consume it.
 */
export function validateCatalog(catalog: readonly CatalogEntry[] = CATALOG): CatalogValidationResult {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const entry of catalog) {
    if (ids.has(entry.id)) {
      errors.push(`Duplicate catalogue id: "${entry.id}".`);
    }
    ids.add(entry.id);
    if (!isExplorationDomain(entry.domain)) {
      errors.push(`Entry "${entry.id}" has invalid domain "${entry.domain}".`);
    }
  }

  // Every prerequisite leaf must reference an existing catalogue id.
  for (const entry of catalog) {
    for (const leaf of prerequisiteLeafIds(entry.prerequisites)) {
      if (!ids.has(leaf)) {
        errors.push(`Entry "${entry.id}" requires unknown id "${leaf}".`);
      }
    }
  }

  for (const cycle of findPrerequisiteCycles(catalog)) {
    errors.push(`Prerequisite cycle detected: ${cycle.join(' -> ')}.`);
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Returns at most one prerequisite cycle (as an ordered id list) found via DFS
 * over the dependency graph. Empty when the graph is acyclic.
 */
function findPrerequisiteCycles(catalog: readonly CatalogEntry[]): string[][] {
  const adjacency = new Map<string, string[]>();
  for (const entry of catalog) {
    adjacency.set(entry.id, prerequisiteLeafIds(entry.prerequisites));
  }
  const visiting = new Set<string>();
  const done = new Set<string>();
  const stack: string[] = [];
  const cycles: string[][] = [];

  const visit = (id: string): boolean => {
    if (done.has(id)) return false;
    if (visiting.has(id)) {
      const start = stack.indexOf(id);
      cycles.push(stack.slice(start >= 0 ? start : 0).concat(id));
      return true;
    }
    visiting.add(id);
    stack.push(id);
    const found = (adjacency.get(id) ?? []).some((next) => adjacency.has(next) && visit(next));
    visiting.delete(id);
    stack.pop();
    if (!found) done.add(id);
    return found;
  };

  for (const entry of catalog) {
    if (!done.has(entry.id) && visit(entry.id)) break;
  }
  return cycles;
}
