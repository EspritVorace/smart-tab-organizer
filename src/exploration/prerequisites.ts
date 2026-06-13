/**
 * Prerequisite model for the exploration catalogue (US-A016).
 *
 * A prerequisite is a recursive boolean expression over capability ids. It
 * describes logical *reachability* ("you cannot edit a rule without first
 * creating one or importing a pack"), never a reward gate: the real app is
 * never blocked by it, and no toast is emitted when a capability becomes
 * reachable.
 */
export type Prerequisite =
  | string
  | { allOf: Prerequisite[] }
  | { anyOf: Prerequisite[] };

function isAllOf(p: Prerequisite): p is { allOf: Prerequisite[] } {
  return typeof p === 'object' && p !== null && 'allOf' in p;
}

function isAnyOf(p: Prerequisite): p is { anyOf: Prerequisite[] } {
  return typeof p === 'object' && p !== null && 'anyOf' in p;
}

/**
 * Evaluates a prerequisite expression against the set of discovered ids (the
 * union of automatic discoveries and manual marks). A bare id is a leaf:
 * satisfied iff it belongs to the set. `allOf` requires every branch; `anyOf`
 * requires at least one. An empty expression resolves to satisfied.
 */
export function isPrerequisiteMet(prereq: Prerequisite | undefined, discovered: ReadonlySet<string>): boolean {
  if (prereq === undefined) return true;
  if (typeof prereq === 'string') return discovered.has(prereq);
  if (isAllOf(prereq)) return prereq.allOf.every((p) => isPrerequisiteMet(p, discovered));
  if (isAnyOf(prereq)) return prereq.anyOf.some((p) => isPrerequisiteMet(p, discovered));
  return true;
}

/**
 * Collects, for an *unsatisfied* prerequisite, a clear-text description tree of
 * what is still missing, so the UI can render "Requires: A or B". Returns
 * `null` when the prerequisite is already satisfied (nothing to show).
 */
export type MissingPrerequisite =
  | { kind: 'leaf'; id: string }
  | { kind: 'allOf'; parts: MissingPrerequisite[] }
  | { kind: 'anyOf'; parts: MissingPrerequisite[] };

export function describeMissing(
  prereq: Prerequisite | undefined,
  discovered: ReadonlySet<string>,
): MissingPrerequisite | null {
  if (prereq === undefined) return null;
  if (typeof prereq === 'string') {
    return discovered.has(prereq) ? null : { kind: 'leaf', id: prereq };
  }
  if (isAllOf(prereq)) {
    const parts = prereq.allOf
      .map((p) => describeMissing(p, discovered))
      .filter((p): p is MissingPrerequisite => p !== null);
    if (parts.length === 0) return null;
    return parts.length === 1 ? parts[0] : { kind: 'allOf', parts };
  }
  // anyOf: if any branch is satisfied the whole thing is met -> nothing missing.
  if (isPrerequisiteMet(prereq, discovered)) return null;
  const parts = prereq.anyOf
    .map((p) => describeMissing(p, discovered))
    .filter((p): p is MissingPrerequisite => p !== null);
  if (parts.length === 0) return null;
  return parts.length === 1 ? parts[0] : { kind: 'anyOf', parts };
}

/** Flattens every leaf id referenced anywhere in a prerequisite expression. */
export function prerequisiteLeafIds(prereq: Prerequisite | undefined): string[] {
  if (prereq === undefined) return [];
  if (typeof prereq === 'string') return [prereq];
  let branches: Prerequisite[] = [];
  if (isAllOf(prereq)) branches = prereq.allOf;
  else if (isAnyOf(prereq)) branches = prereq.anyOf;
  return branches.flatMap(prerequisiteLeafIds);
}
