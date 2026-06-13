import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CATALOG } from '../../src/exploration/catalog';

/**
 * Regression guard for the exploration tracker (US-A008/A009).
 *
 * Every catalogue capability MUST be wired to an automatic detection touchpoint
 * (`markDiscovered('id')` / `markValue('id', ...)`) somewhere in `src/`, so that
 * doing the corresponding action actually advances the catalogue. This test
 * exists because a whole batch of capabilities (entire domains) once shipped
 * declared in the catalogue but never wired, so performing the action lit up
 * nothing. It scans the source tree (minus the exploration internals that only
 * *declare* ids) and asserts each id is referenced.
 *
 * A handful of ids are produced through string templates rather than literals
 * (e.g. `markDiscovered(\`sessions.restore.${target}\`)`); those are listed in
 * `WIRED_VIA_TEMPLATE` with the call site that covers them.
 */

const SRC_ROOT = join(process.cwd(), 'src');

// Files that reference catalogue ids only to declare/validate them, never to
// detect a capability. Excluded so they don't count as "wiring".
const EXCLUDED_FILES = new Set(
  [
    'exploration/catalog.ts',
    'exploration/coverage.ts',
    'exploration/prerequisites.ts',
    'exploration/validateCatalog.ts',
    'exploration/domains.ts',
    'exploration/phases.ts',
    'exploration/index.ts',
    'exploration/progressStore.ts',
  ].map((p) => join(SRC_ROOT, p)),
);

// Ids emitted through a runtime template, with the call site that produces them.
const WIRED_VIA_TEMPLATE: Record<string, string> = {
  // DomainRuleConfigForm: `grouping.mode.${configMode}`
  'grouping.mode.preset': 'grouping.mode.${configMode}',
  'grouping.mode.ask': 'grouping.mode.${configMode}',
  'grouping.mode.manual': 'grouping.mode.${configMode}',
  'grouping.mode.label': 'grouping.mode.${configMode}',
  // SessionsPage handleQuickRestore: `sessions.restore.${target}`
  'sessions.restore.current': 'sessions.restore.${target}',
  'sessions.restore.new': 'sessions.restore.${target}',
  'sessions.restore.replace': 'sessions.restore.${target}',
};

function collectTsFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectTsFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.(test|stories)\.(ts|tsx)$/.test(entry) && !EXCLUDED_FILES.has(full)) {
      acc.push(full);
    }
  }
  return acc;
}

const SOURCE_TEXT = collectTsFiles(SRC_ROOT)
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

function isWired(id: string): boolean {
  if (WIRED_VIA_TEMPLATE[id]) return SOURCE_TEXT.includes(WIRED_VIA_TEMPLATE[id]);
  return SOURCE_TEXT.includes(`'${id}'`) || SOURCE_TEXT.includes(`"${id}"`);
}

describe('exploration catalogue wiring', () => {
  it('wires every catalogue capability to an automatic detection touchpoint', () => {
    const unwired = CATALOG.map((c) => c.id).filter((id) => !isWired(id));
    expect(unwired).toEqual([]);
  });
});
