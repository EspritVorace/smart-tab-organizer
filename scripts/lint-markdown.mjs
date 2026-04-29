#!/usr/bin/env node
/**
 * Reads ctrf/lint-ctrf-report.json (produced by `pnpm lint:ctrf`) and writes
 * a markdown summary suitable for a sticky PR comment. Mirrors the layout of
 * jscpd-markdown.mjs and coverage-markdown.mjs.
 *
 * Output: stdout. Caller redirects to a file (e.g. ctrf/lint.md).
 */

import fs from 'node:fs';
import path from 'node:path';

const REPORT_PATH = process.argv[2] ?? 'ctrf/lint-ctrf-report.json';

if (!fs.existsSync(REPORT_PATH)) {
  process.stdout.write(
    `## :wrench: Lint Report\n\n_No lint report found at \`${REPORT_PATH}\`._\n`,
  );
  process.exit(0);
}

const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
const tests = report?.results?.tests ?? [];

const violations = tests.filter((t) => t.status !== 'passed');
const errors = violations.filter((t) => t.extra?.severity === 'error');
const warnings = violations.filter((t) => t.extra?.severity === 'warning');

const filesAnalyzed = new Set(tests.map((t) => t.extra?.file ?? t.suite ?? t.name)).size;
const filesWithIssues = new Set(
  violations.map((v) => v.extra?.file ?? v.suite ?? ''),
).size;

const cwd = process.cwd();
const toRel = (p) => {
  if (!p) return '';
  return path.isAbsolute(p) ? path.relative(cwd, p) : p;
};

const tally = (arr, keyFn) => {
  const counts = new Map();
  for (const item of arr) {
    const key = keyFn(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
};

const topRules = tally(violations, (v) => v.extra?.ruleId).slice(0, 10);
const topFiles = tally(violations, (v) => toRel(v.extra?.file)).slice(0, 10);

const errIcon = errors.length > 0 ? ':red_circle:' : ':green_circle:';
const warnIcon =
  warnings.length === 0
    ? ':green_circle:'
    : warnings.length < 50
      ? ':yellow_circle:'
      : ':red_circle:';

const out = [];
out.push('## :wrench: Lint Report (ESLint + SonarJS)');
out.push('');
out.push('| Metric | Value |');
out.push('|---|---:|');
out.push(`| Files analyzed | ${filesAnalyzed} |`);
out.push(`| Files with issues | ${filesWithIssues} |`);
out.push(`| ${errIcon} Errors | **${errors.length}** |`);
out.push(`| ${warnIcon} Warnings | **${warnings.length}** |`);
out.push('');

if (topRules.length > 0) {
  out.push('### Top rules');
  out.push('');
  out.push('| Rule | Count |');
  out.push('|---|---:|');
  for (const [rule, count] of topRules) {
    out.push(`| \`${rule}\` | ${count} |`);
  }
  out.push('');
}

if (topFiles.length > 0) {
  out.push('### Top files');
  out.push('');
  out.push('| File | Issues |');
  out.push('|---|---:|');
  for (const [file, count] of topFiles) {
    out.push(`| \`${file}\` | ${count} |`);
  }
  out.push('');
}

if (violations.length > 0) {
  out.push('<details>');
  out.push(`<summary>All violations (${violations.length})</summary>`);
  out.push('');
  for (const v of violations) {
    const file = toRel(v.extra?.file);
    const line = v.extra?.line ?? 0;
    const col = v.extra?.column ?? 0;
    const rule = v.extra?.ruleId ?? '';
    const sev = v.extra?.severity === 'error' ? ':red_circle:' : ':yellow_circle:';
    const msg = (v.message ?? '').replace(/\|/g, '\\|');
    out.push(`- ${sev} \`${file}:${line}:${col}\` — \`${rule}\` — ${msg}`);
  }
  out.push('');
  out.push('</details>');
  out.push('');
} else {
  out.push('_No lint violations._');
  out.push('');
}

process.stdout.write(out.join('\n'));
