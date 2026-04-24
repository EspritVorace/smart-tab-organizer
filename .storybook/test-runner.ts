/**
 * Storybook test-runner hooks for accessibility audits.
 *
 * Each story visit runs axe-core (via axe-playwright) and the result is
 * appended (one JSON object per line) to
 * reports/a11y/storybook-shards.jsonl.  After the runner exits, the script
 * scripts/a11y-storybook-consolidate.mjs reads the shards and produces
 * reports/a11y/storybook-a11y.json.
 *
 * Synchronous appendFileSync is used on purpose: the Storybook test-runner
 * (Jest under the hood) does not expose a reliable async global teardown.
 */
import type { TestRunnerConfig } from '@storybook/test-runner';
import { getStoryContext } from '@storybook/test-runner';
import { injectAxe, configureAxe, getViolations } from 'axe-playwright';
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

/** Shard record written to JSONL (one per story). */
export interface StoryShard {
  id: string;
  title: string;
  name: string;
  violations: StoredViolation[];
}

const SHARDS_DIR = resolve(process.cwd(), 'reports/a11y');
const SHARD_PATH = resolve(SHARDS_DIR, 'storybook-shards.jsonl');
const severityOrder: readonly Severity[] = ['minor', 'moderate', 'serious', 'critical'];

function normaliseImpact(impact: string | null | undefined): Severity | null {
  if (!impact) return null;
  return severityOrder.includes(impact as Severity) ? (impact as Severity) : null;
}

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },

  async postVisit(page, context) {
    // Wait for the locale-loading skeleton to disappear before auditing
    // (the preview decorator renders "Loading translations..." until messages resolve).
    await page
      .waitForFunction(
        () => {
          const text = document.body.textContent ?? '';
          return !text.includes('Loading translations');
        },
        { timeout: 5000 },
      )
      .catch(() => {
        // Fall through: audit whatever is rendered.
      });

    const storyContext = await getStoryContext(page, context);
    type AxeParameters = {
      options?: Record<string, unknown>;
      config?: Record<string, unknown>;
      disable?: boolean;
    };
    const a11yParameters = (storyContext.parameters?.a11y ?? {}) as AxeParameters;

    if (a11yParameters.disable) return;

    // Apply the merged axe config (preview + story-level) before running the
    // audit. The Storybook addon-a11y panel reads parameters.a11y.config
    // itself, but the test-runner injects its own axe instance, so we have to
    // propagate the config manually here.
    await configureAxe(page, (a11yParameters.config ?? {}) as Parameters<typeof configureAxe>[1]);

    const violations = await getViolations(
      page,
      undefined,
      (a11yParameters.options ?? {}) as Parameters<typeof getViolations>[2],
    );

    const shard: StoryShard = {
      id: context.id,
      title: storyContext.title ?? context.id,
      name: storyContext.name ?? context.id,
      violations: violations.map((v) => ({
        id: v.id,
        impact: normaliseImpact(v.impact ?? null),
        help: v.help,
        helpUrl: v.helpUrl,
        description: v.description,
        tags: v.tags,
        nodes: v.nodes.length,
      })),
    };

    mkdirSync(SHARDS_DIR, { recursive: true });
    appendFileSync(SHARD_PATH, JSON.stringify(shard) + '\n', 'utf8');
  },
};

export default config;
