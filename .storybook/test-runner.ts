/**
 * Storybook test-runner hooks for accessibility audits.
 *
 * Runs axe-core (via axe-playwright) against every story and aggregates
 * violations into reports/a11y/storybook-a11y.json.
 *
 * Environment variables:
 *   A11Y_FAIL_LEVEL (default: "serious")
 *     One of: "minor" | "moderate" | "serious" | "critical" | "none".
 *     Violations at this level or above make the runner exit with code 1.
 *     Use "none" to never fail (collect only).
 */
import type { TestRunnerConfig } from '@storybook/test-runner';
import { getStoryContext } from '@storybook/test-runner';
import { injectAxe, configureAxe, getViolations } from 'axe-playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

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

interface StoryReportEntry {
  id: string;
  title: string;
  name: string;
  violations: StoredViolation[];
}

interface A11ySummary {
  stories: StoryReportEntry[];
  summary: { critical: number; serious: number; moderate: number; minor: number };
}

const REPORT_PATH = resolve(process.cwd(), 'reports/a11y/storybook-a11y.json');
const severityOrder: Severity[] = ['minor', 'moderate', 'serious', 'critical'];

const collected: StoryReportEntry[] = [];

function normaliseImpact(impact: string | null | undefined): Severity | null {
  if (!impact) return null;
  return severityOrder.includes(impact as Severity) ? (impact as Severity) : null;
}

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
    // Mirror the Storybook addon-a11y preview config and the Playwright helper.
    await configureAxe(page, {
      rules: [],
    });
  },

  async postVisit(page, context) {
    // Wait for the locale-loading skeleton to disappear before auditing
    // (the preview decorator renders "Loading translations..." until messages resolve).
    await page.waitForFunction(() => {
      const text = document.body.textContent ?? '';
      return !text.includes('Loading translations');
    }, { timeout: 5000 }).catch(() => {
      // Fall through: audit whatever is rendered.
    });

    const storyContext = await getStoryContext(page, context);
    type AxeParameters = {
      options?: Record<string, unknown>;
      config?: Record<string, unknown>;
      disable?: boolean;
    };
    const a11yParameters = (storyContext.parameters?.a11y ?? {}) as AxeParameters;

    if (a11yParameters.disable) {
      return;
    }

    const violations = await getViolations(
      page,
      undefined,
      (a11yParameters.options ?? {}) as Parameters<typeof getViolations>[2],
    );

    const stored: StoredViolation[] = violations.map((v) => ({
      id: v.id,
      impact: normaliseImpact(v.impact ?? null),
      help: v.help,
      helpUrl: v.helpUrl,
      description: v.description,
      tags: v.tags,
      nodes: v.nodes.length,
    }));

    collected.push({
      id: context.id,
      title: storyContext.title ?? context.id,
      name: storyContext.name ?? context.id,
      violations: stored,
    });
  },
};

export default config;

async function flush(): Promise<void> {
  const summary = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const story of collected) {
    for (const v of story.violations) {
      if (v.impact) summary[v.impact] += v.nodes;
    }
  }
  const payload: A11ySummary = { stories: collected, summary };
  await mkdir(dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, JSON.stringify(payload, null, 2), 'utf8');
  console.log(
    `[a11y] Storybook report written to ${REPORT_PATH} ` +
      `(critical=${summary.critical}, serious=${summary.serious}, ` +
      `moderate=${summary.moderate}, minor=${summary.minor})`,
  );

  const failLevel = (process.env.A11Y_FAIL_LEVEL ?? 'serious').toLowerCase();
  if (failLevel === 'none') return;
  const thresholdIndex = severityOrder.indexOf(failLevel as Severity);
  if (thresholdIndex < 0) return;
  const blocking = severityOrder.slice(thresholdIndex).reduce(
    (acc, level) => acc + summary[level],
    0,
  );
  if (blocking > 0) {
    console.error(
      `[a11y] ${blocking} violation(s) at or above "${failLevel}" severity.`,
    );
    process.exitCode = 1;
  }
}

process.on('exit', () => {
  // Synchronous best-effort flush so the file is written even when Jest exits.
  void flush();
});
process.on('SIGINT', () => {
  void flush().finally(() => process.exit(130));
});
process.on('SIGTERM', () => {
  void flush().finally(() => process.exit(143));
});
