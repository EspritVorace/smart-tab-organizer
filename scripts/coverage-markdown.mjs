#!/usr/bin/env node
/**
 * Reads coverage/coverage-summary.json and prints a short markdown report
 * containing the 4 coverage percentages. Used by CI to populate the job
 * summary and to post/update a sticky PR comment.
 *
 * Usage:
 *   node scripts/coverage-markdown.mjs            # prints to stdout
 *   node scripts/coverage-markdown.mjs > file.md  # redirect to file
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SUMMARY_PATH = resolve('coverage/coverage-summary.json');

if (!existsSync(SUMMARY_PATH)) {
  console.error(`[coverage-markdown] Missing ${SUMMARY_PATH}.`);
  process.exit(1);
}

const summary = JSON.parse(await readFile(SUMMARY_PATH, 'utf8'));
const total = summary.total;
if (!total) {
  console.error('[coverage-markdown] coverage-summary.json has no "total" key');
  process.exit(1);
}

function emoji(pct) {
  if (pct == null) return ':grey_question:';
  if (pct >= 80) return ':green_circle:';
  if (pct >= 50) return ':yellow_circle:';
  return ':red_circle:';
}

function fmt(metric) {
  const pct = metric?.pct;
  const covered = metric?.covered ?? 0;
  const totalCount = metric?.total ?? 0;
  return {
    emoji: emoji(pct),
    pct: pct == null ? 'n/a' : `${pct.toFixed(2)}%`,
    ratio: `${covered} / ${totalCount}`,
  };
}

const lines = fmt(total.lines);
const branches = fmt(total.branches);
const functions = fmt(total.functions);
const statements = fmt(total.statements);

const md = `## :microscope: Unit Test Coverage

| Metric | Covered | % |
|---|---|---|
| ${lines.emoji} Lines | ${lines.ratio} | **${lines.pct}** |
| ${branches.emoji} Branches | ${branches.ratio} | **${branches.pct}** |
| ${functions.emoji} Functions | ${functions.ratio} | **${functions.pct}** |
| ${statements.emoji} Statements | ${statements.ratio} | **${statements.pct}** |

_Thresholds: :green_circle: ≥80% · :yellow_circle: ≥50% · :red_circle: <50%_
`;

process.stdout.write(md);
