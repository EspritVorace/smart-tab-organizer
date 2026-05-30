#!/usr/bin/env node
/**
 * On-demand routing sync (US-DS011, sub-issue of #257).
 *
 * Resyncs every destination root (`doc/readme/`, `doc/chrome-web-store/`, and
 * the Starlight assets directory) from the captures already cached under
 * `e2e-doc-scenarios/output/`, without re-running Playwright. Reuses
 * `e2e-shared/sharp-save.ts` semantics: every
 * file is re-encoded through `sharp` to strip ancillary PNG chunks and stay
 * byte-stable across runs.
 *
 * Flags:
 *   --prune     Delete destination files that are no longer produced by the
 *               routing manifests. Asks for confirmation unless --yes is set.
 *   --yes       Skip the interactive prompt for --prune.
 *   --dry-run   Print the operations that would run, do not touch any file.
 *   --help      Show usage.
 *
 * Exits non-zero when at least one declared destination has no source on disk
 * (so the user knows a `pnpm doc:scenarios` run is still required upstream).
 *
 * Run via:
 *   pnpm doc:scenarios:sync
 */
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath, pathToFileURL } from 'url';
import sharp from 'sharp';

import { DESTINATION_ROOTS } from '../e2e-shared/routing/destinations.ts';
import { ALL_DESTINATION_TARGETS } from '../e2e-shared/routing/audit.ts';
import { planSync, summarizeSync } from '../e2e-shared/routing/sync.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const SCENARIOS_OUTPUT_ROOT = path.join(PROJECT_ROOT, 'e2e-doc-scenarios/output');
const SCENARIOS_DIR = path.join(PROJECT_ROOT, 'e2e-doc-scenarios/scenarios');

const ALL_LOCALES = ['en', 'fr', 'es'];
const ALL_THEMES = ['light', 'dark'];

function parseArgs(argv) {
  const args = { prune: false, yes: false, dryRun: false, help: false };
  for (const arg of argv) {
    if (arg === '--prune') args.prune = true;
    else if (arg === '--yes' || arg === '-y') args.yes = true;
    else if (arg === '--dry-run' || arg === '-n') args.dryRun = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else {
      console.error(`Unknown argument: ${arg}`);
      args.help = true;
    }
  }
  return args;
}

function printUsage() {
  process.stdout.write(`Usage: pnpm doc:scenarios:sync [--prune] [--yes] [--dry-run]

Resync every destination root from the captures already on disk, without
re-running Playwright.

Options:
  --prune     Delete destination files no longer produced by routing.
  --yes, -y   Skip the interactive confirmation for --prune.
  --dry-run   Print operations that would run, touch no file.
  --help, -h  Show this help message.
`);
}

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
        captures.push({
          locale,
          theme,
          capture,
          sourcePath: path.join(dir, entry.name),
        });
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

async function executeCopy(copy) {
  const root = DESTINATION_ROOTS[copy.destination];
  const targetPath = path.join(root, copy.destinationPath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const buffer = fs.readFileSync(copy.sourcePath);
  // Re-encode through sharp so binary output stays stable (parity with
  // `e2e-shared/sharp-save.ts`, which strips PNG metadata by default).
  await sharp(buffer).png().toFile(targetPath);
}

function executePrune(prune) {
  const root = DESTINATION_ROOTS[prune.destination];
  const targetPath = path.join(root, prune.relativePath);
  fs.rmSync(targetPath, { force: true });
}

async function confirmPrune(prunes) {
  log('');
  log(`The following ${prunes.length} file(s) would be deleted:`);
  for (const prune of prunes) {
    log(`  - ${prune.destination}/${prune.relativePath}`);
  }
  log('');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await new Promise((resolve) => {
      rl.question('Proceed with deletion? [y/N] ', (response) => resolve(response));
    });
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  log('• Loading manifests…');
  const pipelines = await loadPipelines();
  log(`  ${pipelines.length} pipeline(s) discovered.`);

  log('• Scanning destination directories…');
  const destinationFiles = collectDestinationFiles();

  const plan = planSync({ pipelines, destinationFiles, prune: args.prune });
  const summary = summarizeSync(plan);

  log('');
  log('Plan:');
  log(`  copies:   ${summary.copied}`);
  log(`  skipped:  ${summary.skipped} (source PNG missing)`);
  if (args.prune) {
    log(`  prunes:   ${summary.pruned}`);
  }
  for (const dest of summary.byDestination) {
    const parts = [`copied=${dest.copied}`, `skipped=${dest.skipped}`];
    if (args.prune) parts.push(`pruned=${dest.pruned}`);
    log(`  - ${dest.destination.padEnd(18)} ${parts.join(' ')}`);
  }

  if (args.dryRun) {
    log('');
    log('Dry-run mode: no file was modified.');
    if (plan.copies.length > 0) {
      log('');
      log('Copies:');
      for (const copy of plan.copies) {
        const rel = path.relative(PROJECT_ROOT, copy.sourcePath);
        log(`  ${rel} -> ${copy.destination}/${copy.destinationPath}`);
      }
    }
    if (plan.skips.length > 0) {
      log('');
      log('Skipped (source missing):');
      for (const skip of plan.skips) {
        log(`  ${skip.pipeline} :: ${skip.locale}/${skip.theme}/${skip.capture} -> ${skip.destination}/${skip.destinationPath}`);
      }
    }
    if (args.prune && plan.prunes.length > 0) {
      log('');
      log('Prunes:');
      for (const prune of plan.prunes) {
        log(`  ${prune.destination}/${prune.relativePath}`);
      }
    }
    process.exit(plan.skips.length > 0 ? 1 : 0);
  }

  if (plan.copies.length > 0) {
    log('');
    log('• Copying…');
    for (const copy of plan.copies) {
      await executeCopy(copy);
    }
    log(`  ${plan.copies.length} file(s) copied.`);
  }

  if (args.prune && plan.prunes.length > 0) {
    let proceed = args.yes;
    if (!proceed) {
      proceed = await confirmPrune(plan.prunes);
    }
    if (proceed) {
      log('• Pruning orphan destination files…');
      for (const prune of plan.prunes) {
        executePrune(prune);
      }
      log(`  ${plan.prunes.length} file(s) deleted.`);
    } else {
      log('  Prune cancelled.');
    }
  }

  if (plan.skips.length > 0) {
    log('');
    log(`✗ ${plan.skips.length} destination(s) had no source PNG. Run "pnpm doc:scenarios" first.`);
    for (const skip of plan.skips) {
      log(`  - ${skip.pipeline} :: ${skip.locale}/${skip.theme}/${skip.capture}`);
    }
    process.exit(1);
  }

  log('');
  log('✓ Sync complete.');
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
