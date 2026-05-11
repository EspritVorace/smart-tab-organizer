#!/usr/bin/env node
/**
 * Routing audit (US-DS010, sub-issue of #257).
 *
 * Cross-checks every manifest declared under `e2e-screenshots/` and
 * `e2e-doc-scenarios/scenarios/` against:
 *   1. the captures actually written by each pipeline,
 *   2. the files currently sitting under each destination root.
 *
 * Writes `reports/routing-audit.md` and exits with a non-zero status when at
 * least one manifest references a capture missing from the pipeline output.
 *
 * Read-only: no file is ever deleted.
 *
 * Run via:
 *   pnpm doc:scenarios:audit
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { DESTINATION_ROOTS } from '../e2e-shared/routing/destinations.ts';
import {
  ALL_DESTINATION_TARGETS,
  formatAuditMarkdown,
  runAudit,
} from '../e2e-shared/routing/audit.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const SCREENSHOTS_OUTPUT_DIR = path.join(PROJECT_ROOT, 'docs/src/assets/screenshots');
const SCENARIOS_OUTPUT_ROOT = path.join(PROJECT_ROOT, 'e2e-doc-scenarios/output');
const SCENARIOS_DIR = path.join(PROJECT_ROOT, 'e2e-doc-scenarios/scenarios');
const SCREENSHOTS_ROUTING = path.join(PROJECT_ROOT, 'e2e-screenshots/routing.ts');
const REPORT_PATH = path.join(PROJECT_ROOT, 'reports/routing-audit.md');

const ALL_LOCALES = ['en', 'fr', 'es'];
const ALL_THEMES = ['light', 'dark'];

function log(message) {
  process.stdout.write(`${message}\n`);
}

async function importManifest(absolutePath, exportNames) {
  const url = pathToFileURL(absolutePath).href;
  const mod = await import(url);
  for (const name of exportNames) {
    if (mod[name]) return mod[name];
  }
  const candidate = Object.values(mod).find(
    (value) => value && typeof value === 'object' && Array.isArray(value.routes),
  );
  if (candidate) return candidate;
  throw new Error(`No manifest export found in ${absolutePath}`);
}

function listScreenshotCaptures(dir) {
  if (!fs.existsSync(dir)) return [];
  const captures = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.png')) continue;
    const base = entry.name.slice(0, -'.png'.length);
    const parts = base.split('-');
    if (parts.length < 3) continue;
    const [locale, theme, ...rest] = parts;
    if (!ALL_LOCALES.includes(locale)) continue;
    if (!ALL_THEMES.includes(theme)) continue;
    captures.push({ locale, theme, capture: rest.join('-') });
  }
  return captures;
}

function listScenarioCaptures(scenarioId) {
  const captures = [];
  if (!fs.existsSync(SCENARIOS_OUTPUT_ROOT)) return captures;
  for (const locale of ALL_LOCALES) {
    for (const theme of ALL_THEMES) {
      const dir = path.join(SCENARIOS_OUTPUT_ROOT, locale, theme, scenarioId);
      if (!fs.existsSync(dir)) continue;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith('.png')) continue;
        const base = entry.name.slice(0, -'.png'.length);
        const idx = base.indexOf('-');
        if (idx < 0) continue;
        const capture = base.slice(idx + 1);
        if (!capture) continue;
        captures.push({ locale, theme, capture });
      }
    }
  }
  return captures;
}

function walkDestination(root) {
  const files = new Set();
  if (!fs.existsSync(root)) return files;
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith('.png')) {
        const rel = path.relative(root, full).split(path.sep).join('/');
        files.add(rel);
      }
    }
  }
  return files;
}

async function loadPipelines() {
  const pipelines = [];

  const screenshotsManifest = await importManifest(SCREENSHOTS_ROUTING, [
    'SCREENSHOTS_MANIFEST',
  ]);
  pipelines.push({
    id: 'e2e-screenshots',
    manifest: screenshotsManifest,
    capturesPresent: listScreenshotCaptures(SCREENSHOTS_OUTPUT_DIR),
    locales: ALL_LOCALES,
    themes: ALL_THEMES,
    primaryDestination: 'starlight',
  });

  if (fs.existsSync(SCENARIOS_DIR)) {
    const scenarioFiles = fs
      .readdirSync(SCENARIOS_DIR)
      .filter((name) => name.endsWith('.routing.ts'))
      .sort();

    for (const file of scenarioFiles) {
      const scenarioId = file.slice(0, -'.routing.ts'.length);
      const manifest = await importManifest(path.join(SCENARIOS_DIR, file), []);
      pipelines.push({
        id: scenarioId,
        manifest,
        capturesPresent: listScenarioCaptures(scenarioId),
        locales: ALL_LOCALES,
        themes: ALL_THEMES,
      });
    }
  }

  return pipelines;
}

function collectDestinationFiles() {
  const map = new Map();
  for (const target of ALL_DESTINATION_TARGETS) {
    map.set(target, walkDestination(DESTINATION_ROOTS[target]));
  }
  return map;
}

async function main() {
  log('• Loading manifests…');
  const pipelines = await loadPipelines();
  log(`  ${pipelines.length} pipeline(s) discovered.`);

  log('• Scanning destination directories…');
  const destinationFiles = collectDestinationFiles();

  const report = runAudit({ pipelines, destinationFiles });
  const markdown = formatAuditMarkdown(report);

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, markdown, 'utf-8');
  log(`• Report written to ${path.relative(PROJECT_ROOT, REPORT_PATH)}`);

  log('');
  log('Summary:');
  for (const summary of report.destinationSummaries) {
    log(
      `  - ${summary.destination.padEnd(18)} expected=${summary.expected} present=${summary.present} missing=${summary.missing} orphan=${summary.orphan}`,
    );
  }
  log(`  obsolete references: ${report.obsoleteReferences.length}`);
  log(`  orphan captures:     ${report.orphanCaptures.length}`);

  if (report.hasErrors) {
    log('');
    log('✗ Obsolete references detected — see the report.');
    process.exit(1);
  }

  log('');
  log('✓ Routing graph is consistent.');
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
