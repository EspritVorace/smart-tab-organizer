#!/usr/bin/env node
/**
 * Consolidate Storybook a11y shards (reports/a11y/storybook-shards.jsonl)
 * into reports/a11y/storybook-a11y.json.
 *
 * Also cleans up the shard file.  Exits non-zero when the total number of
 * violations at or above A11Y_FAIL_LEVEL (default "serious", "none" disables)
 * is greater than zero.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * @typedef {'minor' | 'moderate' | 'serious' | 'critical'} Severity
 * @typedef {{ id: string, impact: Severity | null, help: string, helpUrl: string, description: string, tags: string[], nodes: number }} Violation
 * @typedef {{ id: string, title: string, name: string, violations: Violation[] }} StoryShard
 */

const REPORTS_DIR = resolve(process.cwd(), 'reports/a11y');
const SHARDS_PATH = resolve(REPORTS_DIR, 'storybook-shards.jsonl');
const OUTPUT_PATH = resolve(REPORTS_DIR, 'storybook-a11y.json');

const SEVERITY_ORDER = /** @type {const} */ (['minor', 'moderate', 'serious', 'critical']);

/** @type {StoryShard[]} */
const stories = [];
if (existsSync(SHARDS_PATH)) {
  const raw = readFileSync(SHARDS_PATH, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      stories.push(/** @type {StoryShard} */ (JSON.parse(trimmed)));
    } catch (error) {
      console.warn(`[a11y-storybook-consolidate] Skipping malformed line:`, error);
    }
  }
}

const summary = { critical: 0, serious: 0, moderate: 0, minor: 0 };
for (const story of stories) {
  for (const v of story.violations) {
    if (v.impact) summary[v.impact] += v.nodes;
  }
}

mkdirSync(REPORTS_DIR, { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify({ stories, summary }, null, 2), 'utf8');
console.log(
  `[a11y-storybook-consolidate] Wrote ${OUTPUT_PATH} ` +
    `(stories=${stories.length}, critical=${summary.critical}, serious=${summary.serious}, ` +
    `moderate=${summary.moderate}, minor=${summary.minor})`,
);

if (existsSync(SHARDS_PATH)) {
  try {
    rmSync(SHARDS_PATH, { force: true });
  } catch (error) {
    console.warn(`[a11y-storybook-consolidate] Could not remove shard file:`, error);
  }
}

const failLevel = (process.env.A11Y_FAIL_LEVEL ?? 'serious').toLowerCase();
if (failLevel !== 'none') {
  const thresholdIndex = SEVERITY_ORDER.indexOf(/** @type {Severity} */ (failLevel));
  if (thresholdIndex >= 0) {
    const blocking = SEVERITY_ORDER.slice(thresholdIndex).reduce(
      (acc, level) => acc + summary[level],
      0,
    );
    if (blocking > 0) {
      console.error(
        `[a11y-storybook-consolidate] ${blocking} violation(s) at or above "${failLevel}".`,
      );
      process.exit(1);
    }
  }
}
