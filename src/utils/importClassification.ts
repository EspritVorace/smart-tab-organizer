import type { DomainRuleSetting } from '../types/syncSettings';

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
  'presetId',
  'enabled'
];

/** Compare two domain rules ignoring id and badge */
export function areDomainRulesEqual(
  ruleA: DomainRuleSetting,
  ruleB: DomainRuleSetting
): boolean {
  return COMPARABLE_PROPERTIES.every(
    prop => ruleA[prop] === ruleB[prop]
  );
}

/** Get list of properties that differ between two rules (ignoring id and badge) */
export function getRuleDifferences(
  ruleA: DomainRuleSetting,
  ruleB: DomainRuleSetting
): PropertyDiff[] {
  const diffs: PropertyDiff[] = [];
  for (const prop of COMPARABLE_PROPERTIES) {
    if (prop === 'label') continue; // Label is the matching key, skip it
    if (ruleA[prop] !== ruleB[prop]) {
      diffs.push({
        property: prop,
        currentValue: ruleA[prop],
        importedValue: ruleB[prop]
      });
    }
  }
  return diffs;
}

/** Classify imported rules into new, conflicting, and identical groups */
export function classifyImportedRules(
  importedRules: DomainRuleSetting[],
  existingRules: DomainRuleSetting[]
): RuleClassification {
  const existingByLabel = new Map<string, DomainRuleSetting>();
  for (const rule of existingRules) {
    existingByLabel.set(rule.label.toLowerCase(), rule);
  }

  const newRules: DomainRuleSetting[] = [];
  const conflictingRules: ConflictingRule[] = [];
  const identicalRules: DomainRuleSetting[] = [];

  for (const imported of importedRules) {
    const existing = existingByLabel.get(imported.label.toLowerCase());

    if (!existing) {
      newRules.push(imported);
    } else if (areDomainRulesEqual(existing, imported)) {
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
