/**
 * Generate `README.md` for a doc-scenarios output directory.
 *
 * Lists every PNG in the directory, paired with the description supplied at
 * `captureStep(...)` time and the manifest-declared destinations (if any).
 * Regenerated on every scenario run, so documentation never drifts from the
 * actual captures.
 */
import * as fs from 'fs';
import * as path from 'path';
import { DESTINATION_ROOTS } from '../../e2e-shared/routing/destinations.js';
import type { Manifest } from '../../e2e-shared/routing/types.js';
import { endScenario, getScenarioOutputDir } from './doc-capture.js';

export interface WriteReadmeOptions {
  /** Title rendered as `# ${title}` at the top of the README. */
  title: string;
  /** Optional short paragraph below the title. */
  intro?: string;
}

export async function writeScenarioReadme(
  options: WriteReadmeOptions,
): Promise<void> {
  const outputDir = getScenarioOutputDir();
  const ctx = endScenario();
  if (!ctx) return;

  fs.mkdirSync(outputDir, { recursive: true });

  const files = fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith('.png'))
    .sort();

  const rows = files.map((file) => {
    const base = file.replace(/\.png$/, '');
    const num = base.split('-')[0];
    const description = ctx.descriptions.get(base) ?? '';
    const destinations = collectDestinations(base, ctx.manifests, ctx.locale, ctx.theme);
    return `| ${num} | \`${file}\` | ${description} | ${destinations || ''} |`;
  });

  const lines: string[] = [];
  lines.push(`# ${options.title}`);
  lines.push('');
  if (options.intro) {
    lines.push(options.intro);
    lines.push('');
  }
  lines.push(`Locale: \`${ctx.locale}\` · Theme: \`${ctx.theme}\``);
  lines.push('');
  if (rows.length === 0) {
    lines.push('_No captures recorded._');
  } else {
    lines.push('| # | File | Description | Routed to |');
    lines.push('|---|------|-------------|-----------|');
    lines.push(...rows);
  }
  lines.push('');
  lines.push('_Regenerated automatically by `pnpm doc:scenarios`._');
  lines.push('');

  fs.writeFileSync(path.join(outputDir, 'README.md'), lines.join('\n'), 'utf-8');
}

function collectDestinations(
  capture: string,
  manifests: Manifest[],
  locale: string,
  theme: string,
): string {
  const items: string[] = [];
  for (const manifest of manifests) {
    for (const route of manifest.routes) {
      if (route.capture !== capture) continue;
      for (const dest of route.destinations) {
        if (dest.locales && !dest.locales.includes(locale as never)) continue;
        if (dest.themes && !dest.themes.includes(theme as never)) continue;
        const root = path.basename(DESTINATION_ROOTS[dest.target]);
        items.push(`${root}/${dest.path}.png`);
      }
    }
  }
  return items.length === 0 ? '' : items.map((i) => `\`${i}\``).join(', ');
}
