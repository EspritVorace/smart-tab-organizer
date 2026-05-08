/**
 * Sequential capture utility for narrative documentation scenarios.
 *
 * `startScenario(id, locale, theme)` resets the counter; subsequent calls to
 * `captureStep(page, name)` save `001-<name>.png`, `002-<name>.png`, … under
 * `e2e-doc-scenarios/output/{locale}/{theme}/{id}/`.
 *
 * `captureStep(page, name, { force: 20 })` jumps to `020-<name>.png` so a
 * scenario can mark act boundaries (issue #257 conventions).
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { Page } from '@playwright/test';
import { savePng } from '../../e2e-shared/sharp-save.js';
import type { Locale, Manifest, Theme } from '../../e2e-shared/routing/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_ROOT = path.resolve(__dirname, '../output');

interface ScenarioContext {
  id: string;
  locale: Locale;
  theme: Theme;
  manifests: Manifest[];
  counter: number;
  /** Description per filename, used by scenario-readme. */
  descriptions: Map<string, string>;
}

let active: ScenarioContext | null = null;

export interface StartScenarioOptions {
  id: string;
  locale: Locale;
  theme: Theme;
  manifests?: Manifest[];
}

export function startScenario(options: StartScenarioOptions): void {
  active = {
    id: options.id,
    locale: options.locale,
    theme: options.theme,
    manifests: options.manifests ?? [],
    counter: 0,
    descriptions: new Map(),
  };
  // Wipe any orphan captures from a previous partial run so the output stays
  // idempotent: the scenario is the source of truth for what should be there.
  const dir = path.join(OUTPUT_ROOT, active.locale, active.theme, active.id);
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.png') || f === 'README.md') {
        fs.rmSync(path.join(dir, f), { force: true });
      }
    }
  }
}

export function endScenario(): ScenarioContext | null {
  const ctx = active;
  active = null;
  return ctx;
}

export function getScenarioContext(): ScenarioContext {
  if (!active) {
    throw new Error('No scenario started — call startScenario() first');
  }
  return active;
}

export interface CaptureStepOptions {
  /** Force the sequential counter to this value (and continue from there). */
  force?: number;
  /** Short human-readable description, persisted in the scenario README. */
  description?: string;
  /** Optional clip rectangle. Defaults to 1280×800 from the top-left. */
  clip?: { x: number; y: number; width: number; height: number };
  /** Capture a specific element via its bounding rect. */
  elementSelector?: string;
}

/**
 * Capture a screenshot of the supplied page and persist it under the active
 * scenario's output directory. Returns the final filename (without extension).
 */
export async function captureStep(
  page: Page,
  name: string,
  options: CaptureStepOptions = {},
): Promise<string> {
  const ctx = getScenarioContext();
  if (options.force !== undefined) {
    ctx.counter = options.force;
  } else {
    ctx.counter += 1;
  }

  const num = String(ctx.counter).padStart(3, '0');
  const filename = `${num}-${name}`;

  let clip = options.clip ?? { x: 0, y: 0, width: 1280, height: 800 };

  if (options.elementSelector) {
    await page
      .locator(options.elementSelector)
      .waitFor({ state: 'attached', timeout: 15_000 });
    const rect = await page.evaluate((selector: string) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    }, options.elementSelector);
    if (!rect || rect.width === 0 || rect.height === 0) {
      throw new Error(
        `captureStep: element "${options.elementSelector}" has zero dimensions`,
      );
    }
    clip = {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  }

  const buffer = await page.screenshot({ clip });
  const outputDir = path.join(OUTPUT_ROOT, ctx.locale, ctx.theme, ctx.id);

  await savePng(buffer, filename, {
    outputDir,
    locale: ctx.locale,
    theme: ctx.theme,
    manifests: ctx.manifests,
    capture: name,
  });

  if (options.description) {
    ctx.descriptions.set(filename, options.description);
  }

  console.log(`  ✓ ${ctx.id}/${filename}.png`);
  return filename;
}

/** Absolute path to the active scenario's output directory. */
export function getScenarioOutputDir(): string {
  const ctx = getScenarioContext();
  return path.join(OUTPUT_ROOT, ctx.locale, ctx.theme, ctx.id);
}
