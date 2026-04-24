#!/usr/bin/env node
/**
 * Consolidate Storybook and Playwright accessibility reports into a single
 * Markdown summary (reports/a11y/summary.md) and a machine-readable JSON
 * (reports/a11y/summary.json).
 *
 * Inputs (both optional):
 *   reports/a11y/storybook-a11y.json
 *   reports/a11y/e2e-a11y.json
 *
 * Optional baseline:
 *   reports/a11y/baseline.json
 *     If present, a "Nouveautés vs baseline" section lists rule IDs that
 *     appear in the current run but not in the baseline.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

/**
 * @typedef {'minor' | 'moderate' | 'serious' | 'critical'} Severity
 * @typedef {{ id: string, impact: Severity | null, help: string, helpUrl: string, description: string, tags: string[], nodes: number }} Violation
 * @typedef {{ id: string, title: string, name: string, violations: Violation[] }} StoryEntry
 * @typedef {{ spec: string, label: string, violations: Violation[] }} ScenarioEntry
 * @typedef {{ critical: number, serious: number, moderate: number, minor: number }} SeveritySummary
 * @typedef {{ stories: StoryEntry[], summary: SeveritySummary }} StorybookReport
 * @typedef {{ scenarios: ScenarioEntry[], summary: SeveritySummary }} E2eReport
 */

const ROOT = process.cwd();
const REPORTS_DIR = resolve(ROOT, 'reports/a11y');
const STORYBOOK_PATH = resolve(REPORTS_DIR, 'storybook-a11y.json');
const E2E_PATH = resolve(REPORTS_DIR, 'e2e-a11y.json');
const BASELINE_PATH = resolve(REPORTS_DIR, 'baseline.json');
const OUT_MD = resolve(REPORTS_DIR, 'summary.md');
const OUT_JSON = resolve(REPORTS_DIR, 'summary.json');

const SEVERITY_ORDER = /** @type {const} */ (['critical', 'serious', 'moderate', 'minor']);
const SEVERITY_RANK = { critical: 4, serious: 3, moderate: 2, minor: 1 };

/**
 * @template T
 * @param {string} path
 * @returns {T | null}
 */
function readJsonIfExists(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.warn(`[a11y-report] Could not parse ${path}:`, error);
    return null;
  }
}

function emptySummary() {
  return { critical: 0, serious: 0, moderate: 0, minor: 0 };
}

/**
 * @param {StorybookReport | null} storybook
 * @param {E2eReport | null} e2e
 */
function computeTotals(storybook, e2e) {
  const totals = emptySummary();
  const sb = storybook?.summary ?? emptySummary();
  const ee = e2e?.summary ?? emptySummary();
  for (const key of SEVERITY_ORDER) {
    totals[key] = sb[key] + ee[key];
  }
  return { storybook: sb, e2e: ee, totals };
}

/**
 * @param {StorybookReport | null} storybook
 * @param {E2eReport | null} e2e
 * @returns {Array<{ id: string, impact: Severity, help: string, helpUrl: string, occurrences: number, examples: string[] }>}
 */
function computeTop(storybook, e2e) {
  /** @type {Map<string, { id: string, impact: Severity, help: string, helpUrl: string, occurrences: number, examples: Set<string> }>} */
  const byRule = new Map();

  /** @param {Violation} v @param {string} example */
  const accumulate = (v, example) => {
    if (!v.impact) return;
    let entry = byRule.get(v.id);
    if (!entry) {
      entry = {
        id: v.id,
        impact: v.impact,
        help: v.help,
        helpUrl: v.helpUrl,
        occurrences: 0,
        examples: new Set(),
      };
      byRule.set(v.id, entry);
    }
    entry.occurrences += v.nodes;
    // Keep the most severe impact seen across all occurrences.
    if (SEVERITY_RANK[v.impact] > SEVERITY_RANK[entry.impact]) {
      entry.impact = v.impact;
    }
    entry.examples.add(example);
  };

  if (storybook) {
    for (const story of storybook.stories) {
      for (const v of story.violations) accumulate(v, story.id);
    }
  }
  if (e2e) {
    for (const scenario of e2e.scenarios) {
      for (const v of scenario.violations) accumulate(v, `${scenario.spec} › ${scenario.label}`);
    }
  }

  const sorted = Array.from(byRule.values()).sort((a, b) => {
    const rank = SEVERITY_RANK[b.impact] - SEVERITY_RANK[a.impact];
    if (rank !== 0) return rank;
    return b.occurrences - a.occurrences;
  });

  return sorted.slice(0, 10).map((e) => ({
    id: e.id,
    impact: e.impact,
    help: e.help,
    helpUrl: e.helpUrl,
    occurrences: e.occurrences,
    examples: Array.from(e.examples).slice(0, 3),
  }));
}

/**
 * @param {StorybookReport | null} storybook
 * @param {E2eReport | null} e2e
 */
function collectCurrentRuleIds(storybook, e2e) {
  const ids = new Set();
  if (storybook) {
    for (const story of storybook.stories) {
      for (const v of story.violations) ids.add(v.id);
    }
  }
  if (e2e) {
    for (const scenario of e2e.scenarios) {
      for (const v of scenario.violations) ids.add(v.id);
    }
  }
  return ids;
}

/**
 * @param {ReturnType<typeof computeTotals>} counts
 */
function renderSummaryTable(counts) {
  const rows = SEVERITY_ORDER.map((level) => {
    const cap = level.charAt(0).toUpperCase() + level.slice(1);
    return `| ${cap} | ${counts.storybook[level]} | ${counts.e2e[level]} | ${counts.totals[level]} |`;
  });
  return [
    '| Severity | Storybook | E2E | Total |',
    '|---|---:|---:|---:|',
    ...rows,
  ].join('\n');
}

/**
 * @param {ReturnType<typeof computeTop>} top
 */
function renderTopViolations(top) {
  if (top.length === 0) return '_No violations detected._';
  return top
    .map((entry, i) => {
      const examples = entry.examples.length
        ? entry.examples.map((e) => `\`${e}\``).join(', ')
        : '_(no example recorded)_';
      return [
        `${i + 1}. **[${entry.id}](${entry.helpUrl})** (${entry.impact}, ${entry.occurrences} occurrence(s))`,
        `   ${entry.help}`,
        `   Examples: ${examples}`,
      ].join('\n');
    })
    .join('\n\n');
}

/**
 * @param {Set<string>} currentIds
 */
function renderBaselineDiff(currentIds) {
  const baseline = readJsonIfExists(BASELINE_PATH);
  if (!baseline || !Array.isArray(baseline.rules)) return null;
  const baseSet = new Set(baseline.rules);
  const added = Array.from(currentIds).filter((id) => !baseSet.has(id)).sort();
  if (added.length === 0) return '_No new rules vs baseline._';
  return added.map((id) => `- \`${id}\``).join('\n');
}

function main() {
  console.log(`[a11y-report] Reading from ${STORYBOOK_PATH}, ${E2E_PATH}`);
  const storybook = /** @type {StorybookReport | null} */ (readJsonIfExists(STORYBOOK_PATH));
  const e2e = /** @type {E2eReport | null} */ (readJsonIfExists(E2E_PATH));
  console.log(
    `[a11y-report] Loaded storybook=${storybook ? `${storybook.stories?.length ?? '?'} stories` : 'missing'}, ` +
      `e2e=${e2e ? `${e2e.scenarios?.length ?? '?'} scenarios` : 'missing'}`,
  );

  if (!storybook && !e2e) {
    console.warn('[a11y-report] No input reports found. Nothing to do.');
    mkdirSync(dirname(OUT_MD), { recursive: true });
    writeFileSync(OUT_MD, '# Accessibility report\n\n_No reports available._\n', 'utf8');
    writeFileSync(OUT_JSON, JSON.stringify({ available: false }, null, 2), 'utf8');
    return;
  }

  const counts = computeTotals(storybook, e2e);
  const top = computeTop(storybook, e2e);
  const currentIds = collectCurrentRuleIds(storybook, e2e);
  const baselineSection = renderBaselineDiff(currentIds);

  const sections = [
    '# Accessibility report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    renderSummaryTable(counts),
    '',
    '## Top 10 violations',
    '',
    renderTopViolations(top),
  ];

  if (baselineSection !== null) {
    sections.push('', '## New rules vs baseline', '', baselineSection);
  }

  mkdirSync(dirname(OUT_MD), { recursive: true });
  writeFileSync(OUT_MD, sections.join('\n') + '\n', 'utf8');

  const payload = {
    generatedAt: new Date().toISOString(),
    counts,
    top,
    baselineDiffAvailable: baselineSection !== null,
    sources: {
      storybook: storybook !== null,
      e2e: e2e !== null,
    },
  };
  writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`[a11y-report] Wrote ${OUT_MD} and ${OUT_JSON}`);
}

try {
  main();
} catch (error) {
  console.error('[a11y-report] Fatal error while building summary:', error);
  process.exit(1);
}
