#!/usr/bin/env node
/**
 * Reads .jscpd-report/jscpd-report.json and prints a markdown report
 * containing the overall duplication percentage, per-format breakdown,
 * top file hotspots and a collapsible list of every clone. Used by CI
 * to populate the job summary and to post/update a sticky PR comment.
 *
 * Usage:
 *   node scripts/jscpd-markdown.mjs            # prints to stdout
 *   node scripts/jscpd-markdown.mjs > file.md  # redirect to file
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const REPORT_PATH = resolve('.jscpd-report/jscpd-report.json');
const MAX_HOTSPOTS = 10;
const MAX_CLONES = 30;

if (!existsSync(REPORT_PATH)) {
  console.error(`[jscpd-markdown] Missing ${REPORT_PATH}.`);
  process.exit(1);
}

const report = JSON.parse(await readFile(REPORT_PATH, 'utf8'));
const total = report.statistics?.total;
if (!total) {
  console.error('[jscpd-markdown] Report has no statistics.total key');
  process.exit(1);
}

function emoji(pct) {
  if (pct == null) return ':grey_question:';
  if (pct < 3) return ':green_circle:';
  if (pct < 6) return ':yellow_circle:';
  return ':red_circle:';
}

function fmtPct(pct) {
  return pct == null ? 'n/a' : `${pct.toFixed(2)} %`;
}

// Per-format rows (skip empty formats)
const formatsRows = Object.entries(report.statistics.formats ?? {})
  .map(([name, stats]) => ({ name, ...stats.total }))
  .filter((row) => row.sources > 0)
  .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0));

// File hotspots: sum duplicated lines per file across both sides of each clone
const fileDupLines = new Map();
for (const d of report.duplicates ?? []) {
  const a = d.firstFile?.name;
  const b = d.secondFile?.name;
  if (a) fileDupLines.set(a, (fileDupLines.get(a) ?? 0) + (d.lines ?? 0));
  if (b) fileDupLines.set(b, (fileDupLines.get(b) ?? 0) + (d.lines ?? 0));
}
const hotspots = [...fileDupLines.entries()]
  .sort(([, a], [, b]) => b - a)
  .slice(0, MAX_HOTSPOTS);

// Individual clones, largest first
const clones = (report.duplicates ?? [])
  .map((d) => ({
    lines: d.lines ?? 0,
    a: `${d.firstFile?.name}:${d.firstFile?.start}-${d.firstFile?.end}`,
    b: `${d.secondFile?.name}:${d.secondFile?.start}-${d.secondFile?.end}`,
  }))
  .sort((x, y) => y.lines - x.lines);

const pct = total.percentage;
const pctEmoji = emoji(pct);

const summary = `| Files | Total lines | Clones | Duplication |\n` +
  `|---:|---:|---:|:---|\n` +
  `| ${total.sources} | ${total.lines.toLocaleString('en-US')} | **${total.clones}** | ${pctEmoji} **${fmtPct(pct)}** |`;

const formatsTable = formatsRows.length === 0
  ? '_No files analysed._'
  : [
      '| Format | Files | Clones | Duplicated lines | % |',
      '|---|---:|---:|---:|---:|',
      ...formatsRows.map(
        (r) =>
          `| ${r.name} | ${r.sources} | ${r.clones} | ${r.duplicatedLines} | ${fmtPct(r.percentage)} |`,
      ),
    ].join('\n');

const hotspotsTable = hotspots.length === 0
  ? '_No duplication detected. :tada:_'
  : [
      '| File | Dup. lines |',
      '|---|---:|',
      ...hotspots.map(([file, lines]) => `| \`${file}\` | ${lines} |`),
    ].join('\n');

const clonesList = clones.length === 0
  ? '_No clones._'
  : clones
      .slice(0, MAX_CLONES)
      .map((c) => `- \`${c.a}\` ↔ \`${c.b}\` *(${c.lines} lines)*`)
      .join('\n');

const extraClonesNote = clones.length > MAX_CLONES
  ? `\n\n_...and ${clones.length - MAX_CLONES} more._`
  : '';

const md = `## :mag: Code Duplication (jscpd)

${summary}

### Per format

${formatsTable}

### Top hotspots

${hotspotsTable}

<details>
<summary>All clones (${clones.length})</summary>

${clonesList}${extraClonesNote}

</details>

_Thresholds: :green_circle: <3 % · :yellow_circle: <6 % · :red_circle: ≥6 %_
`;

process.stdout.write(md);
