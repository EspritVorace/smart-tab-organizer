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

// Page-level rules that never fire meaningfully on an isolated component in a
// Storybook iframe (no <main>, no <h1>, no enclosing landmark). They remain
// active in the Playwright E2E audit where full page layouts are exercised.
const DISABLED_RULES_FOR_STORYBOOK = ['region', 'landmark-one-main', 'page-has-heading-one'] as const;

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
    // Disable page-level rules via axe.configure. Using the configure-level
    // API (vs per-run options) makes the override apply to every subsequent
    // getViolations call for this page instance.
    await configureAxe(page, {
      rules: DISABLED_RULES_FOR_STORYBOOK.map((id) => ({ id, enabled: false })),
    });
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
      // The addon-a11y panel reads `config.rules` as an array of
      // { id, enabled } entries (see https://storybook.js.org/docs/writing-tests/accessibility-testing).
      // Mirror that format here so a single per-story override works for both
      // the live panel and CI.
      config?: { rules?: Array<{ id: string; enabled: boolean }> };
      disable?: boolean;
    };
    const a11yParameters = (storyContext.parameters?.a11y ?? {}) as AxeParameters;

    if (a11yParameters.disable) return;

    // Merge per-run overrides from the story's parameters.a11y.options with a
    // rules entry that mutes the page-level rules listed above. This covers the
    // case where axe.configure (in preVisit) would be reset by another caller.
    type RunOptions = Parameters<typeof getViolations>[2];
    const storyOptions = (a11yParameters.options ?? {}) as RunOptions;
    const configRules = Object.fromEntries(
      (a11yParameters.config?.rules ?? []).map((r) => [r.id, { enabled: r.enabled }]),
    );
    const mergedOptions: RunOptions = {
      ...storyOptions,
      rules: {
        ...configRules,
        ...(storyOptions?.rules ?? {}),
        ...Object.fromEntries(
          DISABLED_RULES_FOR_STORYBOOK.map((id) => [id, { enabled: false }]),
        ),
      },
    };

    const violations = await getViolations(page, undefined, mergedOptions);

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
