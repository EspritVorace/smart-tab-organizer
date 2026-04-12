/**
 * Conflict seed for the import-with-conflicts screenshot.
 *
 * buildConflictJson() returns a JSON string that matches the importDataSchema
 * (src/schemas/importExport.ts).  It is constructed programmatically using the
 * same types as the project so that any schema change would surface at the
 * call-site.
 *
 * The three rules demonstrate all three classification outcomes produced by
 * classifyImportedRules() (src/utils/importClassification.ts):
 *
 *   • conflicting  — same label as an existing SCREENSHOT_RULES entry but
 *                    different properties (triggers "Conflicting" section)
 *   • new          — label not present in SCREENSHOT_RULES (triggers "New" section)
 *   • identical    — exact property match with an existing rule (triggers "Identical")
 *
 * Classification key: label (case-insensitive), see importClassification.ts line 71.
 */

// ─── Local type mirrors ───────────────────────────────────────────────────────
// Mirrors src/schemas/importExport.ts → ImportDomainRule / ImportData

type ColorValue =
  | 'grey' | 'blue' | 'red' | 'yellow' | 'green'
  | 'pink' | 'purple' | 'cyan' | 'orange';

type GroupNameSourceValue =
  | 'title' | 'url' | 'manual' | 'smart'
  | 'smart_manual' | 'smart_preset' | 'smart_label';

type DeduplicationMatchModeValue = 'exact' | 'includes';

/** Mirrors src/schemas/importExport.ts → ImportDomainRule */
interface ImportDomainRule {
  id: string;
  domainFilter: string;
  label: string;
  titleParsingRegEx: string;
  urlParsingRegEx: string;
  groupNameSource: GroupNameSourceValue;
  deduplicationMatchMode: DeduplicationMatchModeValue;
  color?: ColorValue;
  categoryId?: string | null;
  deduplicationEnabled: boolean;
  presetId: string | null;
  enabled: boolean;
  badge?: string;
}

/** Mirrors src/schemas/importExport.ts → ImportData */
interface ImportData {
  note?: string;
  domainRules: ImportDomainRule[];
}

// ─── Conflict JSON rules ──────────────────────────────────────────────────────

/**
 * Conflicting rule — label "GitHub" matches the existing seed rule, but
 * groupNameSource and color differ → classifies as "conflicting".
 *
 * Existing seed (SCREENSHOT_RULES):
 *   groupNameSource: 'smart_label', color: 'grey'
 * This import:
 *   groupNameSource: 'title',       color: 'green'
 *
 * COMPARABLE_PROPERTIES checked by areDomainRulesEqual():
 *   domainFilter ✓, label ✓, titleParsingRegEx ✗, groupNameSource ✗, color ✗
 *   → differences found → conflicting
 */
const conflictingRule: ImportDomainRule = {
  id: 'import-github-conflict',
  domainFilter: 'github.com',
  label: 'GitHub',
  titleParsingRegEx: '(.+?)\\s+on\\s+GitHub',
  urlParsingRegEx: '',
  groupNameSource: 'title',
  deduplicationMatchMode: 'exact',
  deduplicationEnabled: true,
  color: 'green',
  categoryId: 'development',
  presetId: null,
  enabled: true,
};

/**
 * New rule — label "Slack" is not present in SCREENSHOT_RULES at all
 * → classifies as "new".
 */
const newRule: ImportDomainRule = {
  id: 'import-slack-new',
  domainFilter: 'app.slack.com',
  label: 'Slack',
  titleParsingRegEx: '',
  urlParsingRegEx: '',
  groupNameSource: 'smart_label',
  deduplicationMatchMode: 'exact',
  deduplicationEnabled: true,
  color: 'cyan',
  categoryId: 'productivity',
  presetId: null,
  enabled: true,
};

/**
 * Identical rule — label "Linear" matches the existing seed rule, and ALL
 * COMPARABLE_PROPERTIES are equal (see importClassification.ts for the list).
 *
 * Must match SCREENSHOT_RULES['sc-rule-linear'] exactly on every comparable
 * field (domainFilter, label, titleParsingRegEx, urlParsingRegEx,
 * groupNameSource, deduplicationMatchMode, color, deduplicationEnabled,
 * groupingEnabled [undefined in both], categoryId, presetId, enabled).
 */
const identicalRule: ImportDomainRule = {
  id: 'import-linear-identical', // id is excluded from comparison
  domainFilter: 'linear.app',
  label: 'Linear',
  titleParsingRegEx: '',
  urlParsingRegEx: '',
  groupNameSource: 'smart_label',
  deduplicationMatchMode: 'exact',
  deduplicationEnabled: true,
  color: 'purple',
  categoryId: 'development',
  presetId: null,
  enabled: true,
  // badge omitted (excluded from comparison) — matches undefined in seed rule
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a valid import JSON string (matching importDataSchema) that will
 * produce one "new" rule, one "conflicting" rule, and one "identical" rule
 * when imported on top of SCREENSHOT_RULES.
 */
export function buildConflictJson(): string {
  const importData: ImportData = {
    note: 'Exported from work laptop, April 2026',
    domainRules: [conflictingRule, newRule, identicalRule],
  };
  return JSON.stringify(importData, null, 2);
}
