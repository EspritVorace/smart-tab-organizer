/**
 * Pure routing-audit logic.
 *
 * Diffs the captures actually produced by each pipeline against the
 * destinations declared in their manifests, plus the files currently sitting
 * in destination directories. Filesystem access lives in the wrapping script
 * (`scripts/doc-scenarios-audit.mjs`); this module only manipulates plain
 * data so it can be unit-tested in isolation.
 */
import type { DestinationTarget, Locale, Manifest, Theme } from './types.js';

export const ALL_DESTINATION_TARGETS: DestinationTarget[] = [
  'starlight',
  'readme',
  'chrome-web-store',
];

/** A capture file actually present in a pipeline's source output. */
export interface CapturePresence {
  capture: string;
  locale: Locale;
  theme: Theme;
}

/** A pipeline groups one manifest with the captures it actually produces. */
export interface Pipeline {
  /** Display label used in the report (for example `e2e-screenshots` or `00-main-journey`). */
  id: string;
  manifest: Manifest;
  /** Captures emitted by the pipeline, keyed implicitly by (locale, theme). */
  capturesPresent: CapturePresence[];
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

export interface OrphanCapture {
  pipeline: string;
  capture: string;
  locale: Locale;
  theme: Theme;
}

export interface ObsoleteReference {
  pipeline: string;
  capture: string;
  locale: Locale;
  theme: Theme;
  destination: DestinationTarget;
  destinationPath: string;
}

export interface OrphanDestinationFile {
  destination: DestinationTarget;
  relativePath: string;
}

export interface MissingDestinationFile {
  destination: DestinationTarget;
  relativePath: string;
}

export interface DestinationSummary {
  destination: DestinationTarget;
  expected: number;
  present: number;
  missing: number;
  orphan: number;
}

export interface AuditReport {
  orphanCaptures: OrphanCapture[];
  obsoleteReferences: ObsoleteReference[];
  orphanDestinationFiles: OrphanDestinationFile[];
  missingDestinationFiles: MissingDestinationFile[];
  destinationSummaries: DestinationSummary[];
  /** True when at least one manifest references a capture absent from the pipeline output. */
  hasErrors: boolean;
}

export interface AuditInput {
  pipelines: Pipeline[];
  /** Filenames present under each destination root, expressed relative to the root (with `.png`). */
  destinationFiles: Map<DestinationTarget, Set<string>>;
}

/**
 * Resolve a destination route to a relative `.png` filename under the
 * destination root. Mirrors `formatDestinationPath()` in `e2e-shared/sharp-save.ts`,
 * with the implicit `.png` suffix the actual destination tree carries.
 */
export function resolveDestinationPath(
  templatePath: string,
  locale: Locale,
  theme: Theme,
): string {
  const stem =
    templatePath.includes('{locale}') || templatePath.includes('{theme}')
      ? templatePath.replace(/\{locale\}/g, locale).replace(/\{theme\}/g, theme)
      : `${locale}-${theme}-${templatePath}`;
  return stem.endsWith('.png') ? stem : `${stem}.png`;
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

export function runAudit(input: AuditInput): AuditReport {
  const orphanCaptures: OrphanCapture[] = [];
  const obsoleteReferences: ObsoleteReference[] = [];
  const expected: Record<DestinationTarget, Set<string>> = {
    starlight: new Set<string>(),
    readme: new Set<string>(),
    'chrome-web-store': new Set<string>(),
  };

  for (const pipeline of input.pipelines) {
    const presentByCombo = new Map<string, Set<string>>();
    for (const cap of pipeline.capturesPresent) {
      const k = key(cap.locale, cap.theme);
      let set = presentByCombo.get(k);
      if (!set) {
        set = new Set<string>();
        presentByCombo.set(k, set);
      }
      set.add(cap.capture);
    }

    const referencedByCombo = new Map<string, Set<string>>();

    for (const route of pipeline.manifest.routes) {
      for (const dest of route.destinations) {
        const localesForDest = dest.locales ?? pipeline.locales;
        const themesForDest = dest.themes ?? pipeline.themes;
        for (const locale of localesForDest) {
          for (const theme of themesForDest) {
            const k = key(locale, theme);
            let refs = referencedByCombo.get(k);
            if (!refs) {
              refs = new Set<string>();
              referencedByCombo.set(k, refs);
            }
            refs.add(route.capture);

            const destPath = resolveDestinationPath(dest.path, locale, theme);
            const isPresent = presentByCombo.get(k)?.has(route.capture) ?? false;
            if (!isPresent) {
              obsoleteReferences.push({
                pipeline: pipeline.id,
                capture: route.capture,
                locale,
                theme,
                destination: dest.target,
                destinationPath: destPath,
              });
            } else {
              expected[dest.target].add(destPath);
            }
          }
        }
      }
    }

    if (pipeline.primaryDestination) {
      for (const cap of pipeline.capturesPresent) {
        const filename = `${cap.locale}-${cap.theme}-${cap.capture}.png`;
        expected[pipeline.primaryDestination].add(filename);
      }
    } else {
      for (const cap of pipeline.capturesPresent) {
        const refs = referencedByCombo.get(key(cap.locale, cap.theme));
        if (!refs?.has(cap.capture)) {
          orphanCaptures.push({
            pipeline: pipeline.id,
            capture: cap.capture,
            locale: cap.locale,
            theme: cap.theme,
          });
        }
      }
    }
  }

  const orphanDestinationFiles: OrphanDestinationFile[] = [];
  const missingDestinationFiles: MissingDestinationFile[] = [];
  const destinationSummaries: DestinationSummary[] = [];

  for (const target of ALL_DESTINATION_TARGETS) {
    const exp = expected[target];
    const present = input.destinationFiles.get(target) ?? new Set<string>();

    let missingCount = 0;
    for (const file of exp) {
      if (!present.has(file)) {
        missingCount += 1;
        missingDestinationFiles.push({ destination: target, relativePath: file });
      }
    }
    let orphanCount = 0;
    for (const file of present) {
      if (!exp.has(file)) {
        orphanCount += 1;
        orphanDestinationFiles.push({ destination: target, relativePath: file });
      }
    }
    destinationSummaries.push({
      destination: target,
      expected: exp.size,
      present: present.size,
      missing: missingCount,
      orphan: orphanCount,
    });
  }

  return {
    orphanCaptures: sortBy(orphanCaptures, (c) => `${c.pipeline}/${c.locale}/${c.theme}/${c.capture}`),
    obsoleteReferences: sortBy(
      obsoleteReferences,
      (r) => `${r.pipeline}/${r.locale}/${r.theme}/${r.capture}/${r.destination}`,
    ),
    orphanDestinationFiles: sortBy(orphanDestinationFiles, (f) => `${f.destination}/${f.relativePath}`),
    missingDestinationFiles: sortBy(missingDestinationFiles, (f) => `${f.destination}/${f.relativePath}`),
    destinationSummaries,
    hasErrors: obsoleteReferences.length > 0,
  };
}

export interface FormatAuditMarkdownOptions {
  /** ISO timestamp injected at the top of the report. Defaults to `new Date().toISOString()`. */
  generatedAt?: string;
}

export function formatAuditMarkdown(
  report: AuditReport,
  options: FormatAuditMarkdownOptions = {},
): string {
  const lines: string[] = [];
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  lines.push('# Routing audit report');
  lines.push('');
  lines.push(`Generated: ${generatedAt}`);
  lines.push('');

  lines.push('## Summary by destination');
  lines.push('');
  lines.push('| Destination | Expected | Present | Missing | Orphan |');
  lines.push('|-------------|---------:|--------:|--------:|-------:|');
  for (const summary of report.destinationSummaries) {
    lines.push(
      `| \`${summary.destination}\` | ${summary.expected} | ${summary.present} | ${summary.missing} | ${summary.orphan} |`,
    );
  }
  lines.push('');

  lines.push('## Obsolete references');
  lines.push('');
  lines.push('Captures referenced by a manifest but missing from the pipeline output.');
  lines.push('');
  if (report.obsoleteReferences.length === 0) {
    lines.push('_None._');
  } else {
    lines.push('| Pipeline | Capture | Locale | Theme | Destination | Path |');
    lines.push('|----------|---------|--------|-------|-------------|------|');
    for (const ref of report.obsoleteReferences) {
      lines.push(
        `| \`${ref.pipeline}\` | \`${ref.capture}\` | ${ref.locale} | ${ref.theme} | \`${ref.destination}\` | \`${ref.destinationPath}\` |`,
      );
    }
  }
  lines.push('');

  lines.push('## Orphan captures');
  lines.push('');
  lines.push('Captures produced by a pipeline but referenced in no manifest.');
  lines.push('');
  if (report.orphanCaptures.length === 0) {
    lines.push('_None._');
  } else {
    lines.push('| Pipeline | Capture | Locale | Theme |');
    lines.push('|----------|---------|--------|-------|');
    for (const cap of report.orphanCaptures) {
      lines.push(`| \`${cap.pipeline}\` | \`${cap.capture}\` | ${cap.locale} | ${cap.theme} |`);
    }
  }
  lines.push('');

  lines.push('## Orphan destination files');
  lines.push('');
  lines.push('Files present in a destination directory that the routing no longer produces.');
  lines.push('');
  if (report.orphanDestinationFiles.length === 0) {
    lines.push('_None._');
  } else {
    lines.push('| Destination | File |');
    lines.push('|-------------|------|');
    for (const file of report.orphanDestinationFiles) {
      lines.push(`| \`${file.destination}\` | \`${file.relativePath}\` |`);
    }
  }
  lines.push('');

  lines.push('## Missing destination files');
  lines.push('');
  lines.push('Files declared by routing but absent from the destination directory.');
  lines.push('');
  if (report.missingDestinationFiles.length === 0) {
    lines.push('_None._');
  } else {
    lines.push('| Destination | File |');
    lines.push('|-------------|------|');
    for (const file of report.missingDestinationFiles) {
      lines.push(`| \`${file.destination}\` | \`${file.relativePath}\` |`);
    }
  }
  lines.push('');
  return lines.join('\n');
}
