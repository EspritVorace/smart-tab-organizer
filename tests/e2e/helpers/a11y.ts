/**
 * Reusable accessibility helper for Playwright E2E specs.
 *
 * Usage:
 *   import { auditPage } from './helpers/a11y';
 *   await auditPage(page, 'sessions-list-loaded');
 *
 * The helper is a no-op unless A11Y_ENABLED=true is exported in the environment.
 * Violations are appended (one JSON object per line) to
 * reports/a11y/e2e-shards/<pid>.jsonl while tests run.  A Playwright globalTeardown
 * (see `playwright.globalTeardown.ts`) consolidates the shards into
 * reports/a11y/e2e-a11y.json.
 *
 * To scope an audit, pass `include` or `exclude` selectors:
 *   await auditPage(page, 'restore-wizard-conflict-step', {
 *     include: '[role="dialog"]',
 *   });
 */
import AxeBuilder from '@axe-core/playwright';
import type { Page, TestInfo } from '@playwright/test';
import { test as baseTest } from '@playwright/test';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

type Severity = 'minor' | 'moderate' | 'serious' | 'critical';

interface StoredViolation {
  id: string;
  impact: Severity | null;
  help: string;
  helpUrl: string;
  description: string;
  tags: string[];
  nodes: number;
}

/** Shard record written to JSONL (one per call to auditPage). */
export interface ScenarioShard {
  spec: string;
  label: string;
  violations: StoredViolation[];
}

export const E2E_SHARDS_DIR = resolve(process.cwd(), 'reports/a11y/e2e-shards');
const severityOrder: readonly Severity[] = ['minor', 'moderate', 'serious', 'critical'];

export interface AuditPageOptions {
  include?: string;
  exclude?: string;
  /** Rule IDs to disable for this specific audit. Always include a justification in a code comment. */
  disableRules?: string[];
}

function isEnabled(): boolean {
  return process.env.A11Y_ENABLED === 'true';
}

function normaliseImpact(impact: string | null | undefined): Severity | null {
  if (!impact) return null;
  return severityOrder.includes(impact as Severity) ? (impact as Severity) : null;
}

function currentSpec(): string {
  try {
    const info: TestInfo = baseTest.info();
    return info.file
      ? info.file.split('/').slice(-1)[0]
      : info.titlePath[0] ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Run an axe audit on the current page (or a sub-region) and append
 * the result to a per-worker JSONL shard.  No-op when A11Y_ENABLED is unset.
 */
export async function auditPage(
  page: Page,
  label: string,
  options: AuditPageOptions = {},
): Promise<void> {
  if (!isEnabled()) return;

  let builder = new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
    'best-practice',
  ]);
  if (options.include) builder = builder.include(options.include);
  if (options.exclude) builder = builder.exclude(options.exclude);
  if (options.disableRules?.length) builder = builder.disableRules(options.disableRules);

  const results = await builder.analyze();

  const shard: ScenarioShard = {
    spec: currentSpec(),
    label,
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: normaliseImpact(v.impact ?? null),
      help: v.help,
      helpUrl: v.helpUrl,
      description: v.description,
      tags: v.tags,
      nodes: v.nodes.length,
    })),
  };

  mkdirSync(E2E_SHARDS_DIR, { recursive: true });
  const shardFile = resolve(E2E_SHARDS_DIR, `worker-${process.pid}.jsonl`);
  appendFileSync(shardFile, JSON.stringify(shard) + '\n', 'utf8');
}
