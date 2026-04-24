/**
 * Playwright globalTeardown for the accessibility pipeline.
 *
 * Reads all per-worker JSONL shards from reports/a11y/e2e-shards/ and
 * writes a consolidated JSON report at reports/a11y/e2e-a11y.json.
 *
 * Exits with a non-zero code when the total number of violations at or above
 * A11Y_FAIL_LEVEL (default "serious", set to "none" to disable) is greater
 * than zero.  The teardown is a no-op when A11Y_ENABLED is unset (no shard
 * files will exist).
 */
import { readdirSync, readFileSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ScenarioShard } from './a11y';

type Severity = 'minor' | 'moderate' | 'serious' | 'critical';

interface E2eA11yReport {
  scenarios: ScenarioShard[];
  summary: { critical: number; serious: number; moderate: number; minor: number };
}

const severityOrder: readonly Severity[] = ['minor', 'moderate', 'serious', 'critical'];
const REPORTS_DIR = resolve(process.cwd(), 'reports/a11y');
const SHARDS_DIR = resolve(REPORTS_DIR, 'e2e-shards');
const OUTPUT_PATH = resolve(REPORTS_DIR, 'e2e-a11y.json');

export default async function globalTeardown(): Promise<void> {
  if (!existsSync(SHARDS_DIR)) {
    if (process.env.A11Y_ENABLED === 'true') {
      // Still write an empty report so downstream tooling does not fail on a missing file.
      mkdirSync(REPORTS_DIR, { recursive: true });
      const empty: E2eA11yReport = {
        scenarios: [],
        summary: { critical: 0, serious: 0, moderate: 0, minor: 0 },
      };
      writeFileSync(OUTPUT_PATH, JSON.stringify(empty, null, 2), 'utf8');
    }
    return;
  }

  const scenarios: ScenarioShard[] = [];
  for (const file of readdirSync(SHARDS_DIR)) {
    if (!file.endsWith('.jsonl')) continue;
    const raw = readFileSync(resolve(SHARDS_DIR, file), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        scenarios.push(JSON.parse(trimmed) as ScenarioShard);
      } catch (error) {
        console.warn(`[a11y] Skipping malformed shard line in ${file}:`, error);
      }
    }
  }

  const summary = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const scenario of scenarios) {
    for (const v of scenario.violations) {
      if (v.impact) summary[v.impact] += v.nodes;
    }
  }

  mkdirSync(REPORTS_DIR, { recursive: true });
  const payload: E2eA11yReport = { scenarios, summary };
  writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2), 'utf8');
  console.log(
    `[a11y] Consolidated ${scenarios.length} scenario(s) into ${OUTPUT_PATH} ` +
      `(critical=${summary.critical}, serious=${summary.serious}, ` +
      `moderate=${summary.moderate}, minor=${summary.minor})`,
  );

  // Clean up shards so a subsequent run starts fresh.
  try {
    rmSync(SHARDS_DIR, { recursive: true, force: true });
  } catch (error) {
    console.warn('[a11y] Could not remove shards directory:', error);
  }

  const failLevel = (process.env.A11Y_FAIL_LEVEL ?? 'serious').toLowerCase();
  if (failLevel === 'none') return;
  const thresholdIndex = severityOrder.indexOf(failLevel as Severity);
  if (thresholdIndex < 0) return;
  const blocking = severityOrder
    .slice(thresholdIndex)
    .reduce((acc, level) => acc + summary[level], 0);
  if (blocking > 0) {
    console.error(`[a11y] ${blocking} E2E violation(s) at or above "${failLevel}" severity.`);
    process.exitCode = 1;
  }
}
