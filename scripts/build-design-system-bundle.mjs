#!/usr/bin/env node
/**
 * Builds design-system-bundle/ (and optionally design-system-bundle.zip)
 * containing only the design-system surface of the extension:
 *   - src/components/UI, src/components/Form, src/pages
 *   - src/styles/radix-themes.css
 *   - src/utils/themeConstants.ts, src/utils/i18n.ts
 *   - src/stories (Welcome), .storybook/
 *   - DESIGN.md, package.json, tsconfig.json
 *
 * Intended as input for Claude Design (claude.ai/design), so that the repo's
 * Astro Starlight docs, background worker, hooks, schemas and tests stay out
 * of the upload.
 *
 * Usage:
 *   node scripts/build-design-system-bundle.mjs        # copy only
 *   node scripts/build-design-system-bundle.mjs --zip  # copy + produce .zip
 */
import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const BUNDLE_DIR = resolve(ROOT, 'design-system-bundle');
const BUNDLE_ZIP = resolve(ROOT, 'design-system-bundle.zip');

const ENTRIES = [
  { from: 'src/components/UI', to: 'src/components/UI' },
  { from: 'src/components/Form', to: 'src/components/Form' },
  { from: 'src/pages', to: 'src/pages' },
  { from: 'src/styles/radix-themes.css', to: 'src/styles/radix-themes.css' },
  { from: 'src/utils/themeConstants.ts', to: 'src/utils/themeConstants.ts' },
  { from: 'src/utils/i18n.ts', to: 'src/utils/i18n.ts' },
  { from: 'src/stories', to: 'src/stories', optional: true },
  { from: '.storybook', to: '.storybook' },
  { from: 'DESIGN.md', to: 'DESIGN.md' },
  { from: 'package.json', to: 'package.json' },
  { from: 'tsconfig.json', to: 'tsconfig.json' },
];

const BUNDLE_README = `# Smart Tab Organizer design system

Extrait automatique pour Claude Design (claude.ai/design).

- Voir \`DESIGN.md\` pour la synthese (tokens, composants, regles).
- Regenerer via \`pnpm design-system:bundle\` ou \`pnpm design-system:zip\`.
`;

async function countFiles(dir) {
  let count = 0;
  let bytes = 0;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        count += 1;
        bytes += (await stat(full)).size;
      }
    }
  }
  return { count, bytes };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
  const wantZip = process.argv.includes('--zip');

  if (existsSync(BUNDLE_DIR)) {
    await rm(BUNDLE_DIR, { recursive: true, force: true });
  }
  if (existsSync(BUNDLE_ZIP)) {
    await rm(BUNDLE_ZIP, { force: true });
  }
  await mkdir(BUNDLE_DIR, { recursive: true });

  for (const { from, to, optional } of ENTRIES) {
    const src = resolve(ROOT, from);
    const dest = resolve(BUNDLE_DIR, to);

    if (!existsSync(src)) {
      if (optional) continue;
      console.error(`[design-system] Missing required source: ${relative(ROOT, src)}`);
      process.exit(1);
    }

    await mkdir(dirname(dest), { recursive: true });
    await cp(src, dest, { recursive: true });
  }

  await writeFile(join(BUNDLE_DIR, 'README.md'), BUNDLE_README);

  const { count, bytes } = await countFiles(BUNDLE_DIR);
  console.log(
    `[design-system] Bundle ready at ${relative(ROOT, BUNDLE_DIR)}/ (${count} files, ${formatBytes(bytes)})`,
  );

  if (wantZip) {
    try {
      execFileSync('zip', ['-rq', BUNDLE_ZIP, 'design-system-bundle'], {
        cwd: ROOT,
        stdio: 'inherit',
      });
      const zipSize = (await stat(BUNDLE_ZIP)).size;
      console.log(
        `[design-system] Zip ready at ${relative(ROOT, BUNDLE_ZIP)} (${formatBytes(zipSize)})`,
      );
    } catch (err) {
      console.error(
        '[design-system] Failed to produce zip. Install the "zip" CLI or rerun without --zip.',
      );
      console.error(err.message);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error('[design-system] Failed:', err);
  process.exit(1);
});
