import type { DomainRuleSetting } from '@/types/syncSettings';

export interface PropertyDiff {
  property: string;
  currentValue: unknown;
  importedValue: unknown;
}

export interface ConflictingRule {
  imported: DomainRuleSetting;
  existing: DomainRuleSetting;
  differences: PropertyDiff[];
}

export interface RuleClassification {
  newRules: DomainRuleSetting[];
  conflictingRules: ConflictingRule[];
  identicalRules: DomainRuleSetting[];
}

// Properties to compare (excluding id and badge which are runtime fields)
const COMPARABLE_PROPERTIES: (keyof DomainRuleSetting)[] = [
  'domainFilter',
  'label',
  'titleParsingRegEx',
  'urlParsingRegEx',
  'groupNameSource',
  'deduplicationMatchMode',
  'color',
  'deduplicationEnabled',
  'ignoredQueryParams',
  'groupingEnabled',
  'categoryId',
  'presetId',
  'enabled'
];

// When either side is an array, treat null/undefined on the other side as an
// empty array. This mirrors the Zod default and lets us compare rules that
// were stored before a new array field existed.
function coerceToArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function arrayValuesEqual(arrA: unknown[], arrB: unknown[]): boolean {
  if (arrA.length !== arrB.length) return false;
  return arrA.every((v, i) => v === arrB[i]);
}

function arePropertyValuesEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    return arrayValuesEqual(coerceToArray(a), coerceToArray(b));
  }
  return a === b;
}

/** Compare two domain rules ignoring id and badge */
export function areDomainRulesEqual(
  ruleA: DomainRuleSetting,
  ruleB: DomainRuleSetting
): boolean {
  return COMPARABLE_PROPERTIES.every(
    prop => arePropertyValuesEqual(ruleA[prop], ruleB[prop])
  );
}

/** Get list of properties that differ between two rules (ignoring id and badge) */
export function getRuleDifferences(
  ruleA: DomainRuleSetting,
  ruleB: DomainRuleSetting
): PropertyDiff[] {
  const diffs: PropertyDiff[] = [];
  for (const prop of COMPARABLE_PROPERTIES) {
    if (!arePropertyValuesEqual(ruleA[prop], ruleB[prop])) {
      diffs.push({
        property: prop,
        currentValue: ruleA[prop],
        importedValue: ruleB[prop]
      });
    }
  }
  return diffs;
}

/**
 * Classify imported rules into new, conflicting, and identical groups.
 * Match by `id` first to catch renames; fall back to label match (case
 * insensitive) so re-imports of the same content with a different id still
 * dedupe.
 */
export function classifyImportedRules(
  importedRules: DomainRuleSetting[],
  existingRules: DomainRuleSetting[]
): RuleClassification {
  const existingById = new Map<string, DomainRuleSetting>();
  const existingByLabel = new Map<string, DomainRuleSetting>();
  for (const rule of existingRules) {
    existingById.set(rule.id, rule);
    existingByLabel.set(rule.label.toLowerCase(), rule);
  }

  const matchedExistingIds = new Set<string>();
  const newRules: DomainRuleSetting[] = [];
  const conflictingRules: ConflictingRule[] = [];
  const identicalRules: DomainRuleSetting[] = [];

  for (const imported of importedRules) {
    let existing = existingById.get(imported.id);
    if (!existing) {
      const labelMatch = existingByLabel.get(imported.label.toLowerCase());
      if (labelMatch && !matchedExistingIds.has(labelMatch.id)) {
        existing = labelMatch;
      }
    }

    if (!existing) {
      newRules.push(imported);
      continue;
    }

    matchedExistingIds.add(existing.id);
    if (areDomainRulesEqual(existing, imported)) {
      identicalRules.push(imported);
    } else {
      conflictingRules.push({
        imported,
        existing,
        differences: getRuleDifferences(existing, imported)
      });
    }
  }

  return { newRules, conflictingRules, identicalRules };
}
