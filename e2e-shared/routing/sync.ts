/**
 * Pure on-demand sync logic (US-DS011, sub-issue of #257).
 *
 * Computes the set of copy and (optional) prune operations needed to bring the
 * declared destination roots back in line with the existing pipeline captures
 * cached under `e2e-doc-scenarios/output/` (or `docs/src/assets/screenshots/`),
 * without ever re-running Playwright. Filesystem access lives in the wrapping
 * script (`scripts/doc-scenarios-sync.mjs`); this module only manipulates plain
 * data so it can be unit-tested in isolation.
 */
import type { DestinationTarget, Locale, Manifest, Theme } from './types.js';
import { ALL_DESTINATION_TARGETS, resolveDestinationPath } from './audit.ts';

/** A capture file actually sitting in a pipeline's source output. */
export interface SyncSourceCapture {
  capture: string;
  locale: Locale;
  theme: Theme;
  /** Absolute path to the source PNG. Copied verbatim into the plan. */
  sourcePath: string;
}

/** A pipeline groups one manifest with the captures actually on disk. */
export interface SyncPipeline {
  /** Display label used in logs (e.g. `e2e-screenshots` or `00-main-journey`). */
  id: string;
  manifest: Manifest;
  /** Captures present on disk for this pipeline. */
  capturesPresent: SyncSourceCapture[];
  /** Locales the pipeline runs through. Used to expand routes that omit `locales`. */
  locales: Locale[];
  /** Themes the pipeline runs through. Used to expand routes that omit `themes`. */
  themes: Theme[];
  /**
   * If set, every present capture also lands directly in this destination
   * (used for `e2e-screenshots`, whose primary outputDir is `docs/src/assets/screenshots/`).
   */
  primaryDestination?: DestinationTarget;
}

export interface SyncCopyOp {
  pipeline: string;
  capture: string;
  locale: Locale;
  theme: Theme;
  sourcePath: string;
  destination: DestinationTarget;
  /** Relative path under the destination root, with `.png` suffix. */
  destinationPath: string;
}

export interface SyncSkipOp {
  pipeline: string;
  capture: string;
  locale: Locale;
  theme: Theme;
  destination: DestinationTarget;
  destinationPath: string;
  reason: 'source-missing';
}

export interface SyncPruneOp {
  destination: DestinationTarget;
  relativePath: string;
}

export interface SyncPlan {
  copies: SyncCopyOp[];
  skips: SyncSkipOp[];
  prunes: SyncPruneOp[];
}

export interface SyncDestinationSummary {
  destination: DestinationTarget;
  copied: number;
  skipped: number;
  pruned: number;
}

export interface SyncSummary {
  copied: number;
  skipped: number;
  pruned: number;
  byDestination: SyncDestinationSummary[];
}

export interface PlanSyncInput {
  pipelines: SyncPipeline[];
  /**
   * Files currently present under each destination root, expressed relative to
   * the root with `.png` suffix. Required when `prune` is true; ignored
   * otherwise (an empty map is fine).
   */
  destinationFiles: Map<DestinationTarget, Set<string>>;
  /** When true, files in destination directories not produced by routing are pruned. */
  prune?: boolean;
}

function key(locale: Locale, theme: Theme): string {
  return `${locale}/${theme}`;
}

function sortBy<T>(items: T[], by: (item: T) => string): T[] {
  return [...items].sort((a, b) => {
    const ka = by(a);
    const kb = by(b);
    if (ka < kb) return -1;
    if (ka > kb) return 1;
    return 0;
  });
}

/**
 * Compute the copy/prune operations needed to resync destination directories
 * from the captures already present on disk.
 *
 * The function never reads or writes files: it returns a plan that the calling
 * script can execute (or print, for `--dry-run`).
 */
export function planSync(input: PlanSyncInput): SyncPlan {
  const copies: SyncCopyOp[] = [];
  const skips: SyncSkipOp[] = [];
  const expected: Record<DestinationTarget, Set<string>> = {
    starlight: new Set<string>(),
    readme: new Set<string>(),
    'chrome-web-store': new Set<string>(),
  };

  for (const pipeline of input.pipelines) {
    const sourceByCombo = new Map<string, Map<string, SyncSourceCapture>>();
    for (const cap of pipeline.capturesPresent) {
      const k = key(cap.locale, cap.theme);
      let bucket = sourceByCombo.get(k);
      if (!bucket) {
        bucket = new Map<string, SyncSourceCapture>();
        sourceByCombo.set(k, bucket);
      }
      bucket.set(cap.capture, cap);
    }

    for (const route of pipeline.manifest.routes) {
      for (const dest of route.destinations) {
        const localesForDest = dest.locales ?? pipeline.locales;
        const themesForDest = dest.themes ?? pipeline.themes;
        for (const locale of localesForDest) {
          for (const theme of themesForDest) {
            const destinationPath = resolveDestinationPath(dest.path, locale, theme);
            const source = sourceByCombo.get(key(locale, theme))?.get(route.capture);
            if (!source) {
              skips.push({
                pipeline: pipeline.id,
                capture: route.capture,
                locale,
                theme,
                destination: dest.target,
                destinationPath,
                reason: 'source-missing',
              });
              continue;
            }
            expected[dest.target].add(destinationPath);
            copies.push({
              pipeline: pipeline.id,
              capture: route.capture,
              locale,
              theme,
              sourcePath: source.sourcePath,
              destination: dest.target,
              destinationPath,
            });
          }
        }
      }
    }

    if (pipeline.primaryDestination) {
      for (const cap of pipeline.capturesPresent) {
        const filename = `${cap.locale}-${cap.theme}-${cap.capture}.png`;
        expected[pipeline.primaryDestination].add(filename);
      }
    }
  }

  const prunes: SyncPruneOp[] = [];
  if (input.prune) {
    for (const target of ALL_DESTINATION_TARGETS) {
      const present = input.destinationFiles.get(target) ?? new Set<string>();
      for (const file of present) {
        if (!expected[target].has(file)) {
          prunes.push({ destination: target, relativePath: file });
        }
      }
    }
  }

  return {
    copies: sortBy(copies, (c) => `${c.destination}/${c.destinationPath}`),
    skips: sortBy(skips, (s) => `${s.destination}/${s.destinationPath}`),
    prunes: sortBy(prunes, (p) => `${p.destination}/${p.relativePath}`),
  };
}

/** Aggregate a plan into per-destination counters for human-readable output. */
export function summarizeSync(plan: SyncPlan): SyncSummary {
  const counters = new Map<DestinationTarget, SyncDestinationSummary>();
  for (const target of ALL_DESTINATION_TARGETS) {
    counters.set(target, { destination: target, copied: 0, skipped: 0, pruned: 0 });
  }
  for (const copy of plan.copies) {
    counters.get(copy.destination)!.copied += 1;
  }
  for (const skip of plan.skips) {
    counters.get(skip.destination)!.skipped += 1;
  }
  for (const prune of plan.prunes) {
    counters.get(prune.destination)!.pruned += 1;
  }
  return {
    copied: plan.copies.length,
    skipped: plan.skips.length,
    pruned: plan.prunes.length,
    byDestination: ALL_DESTINATION_TARGETS.map((t) => counters.get(t)!),
  };
}
