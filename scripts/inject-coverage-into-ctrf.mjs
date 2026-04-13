#!/usr/bin/env node
/**
 * Reads coverage/coverage-summary.json (produced by Vitest coverage-v8) and
 * injects the 4 percentages (lines/branches/functions/statements) into the
 * unit CTRF report under results.tool.extra.coverage.
 *
 * CTRF has no native coverage field, but its schema allows arbitrary metadata
 * in tool.extra — so the coverage travels with the test report as a single
 * artifact and can be picked up by dashboards that know about this convention.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const COVERAGE_SUMMARY = resolve('coverage/coverage-summary.json');
const CTRF_REPORT = resolve('ctrf/unit-ctrf-report.json');

async function main() {
  if (!existsSync(COVERAGE_SUMMARY)) {
    console.error(`[inject-coverage] Missing ${COVERAGE_SUMMARY}. Run "pnpm test:coverage" first.`);
    process.exit(1);
  }
  if (!existsSync(CTRF_REPORT)) {
    console.error(`[inject-coverage] Missing ${CTRF_REPORT}. Did the test run produce a CTRF report?`);
    process.exit(1);
  }

  const summary = JSON.parse(await readFile(COVERAGE_SUMMARY, 'utf8'));
  const ctrf = JSON.parse(await readFile(CTRF_REPORT, 'utf8'));

  const total = summary.total;
  if (!total) {
    console.error('[inject-coverage] coverage-summary.json has no "total" key');
    process.exit(1);
  }

  const coverage = {
    lines: total.lines?.pct ?? null,
    branches: total.branches?.pct ?? null,
    functions: total.functions?.pct ?? null,
    statements: total.statements?.pct ?? null,
    generatedAt: new Date().toISOString(),
  };

  ctrf.results ??= {};
  ctrf.results.tool ??= { name: 'vitest' };
  ctrf.results.tool.extra ??= {};
  ctrf.results.tool.extra.coverage = coverage;

  await writeFile(CTRF_REPORT, JSON.stringify(ctrf, null, 2) + '\n');

  const pct = (v) => (v == null ? 'n/a' : `${v.toFixed(2)}%`);
  console.log(
    `[inject-coverage] lines=${pct(coverage.lines)} branches=${pct(coverage.branches)} functions=${pct(coverage.functions)} statements=${pct(coverage.statements)}`,
  );
}

main().catch((err) => {
  console.error('[inject-coverage] Failed:', err);
  process.exit(1);
});
