/**
 * PNG persistence with manifest-driven copy fan-out.
 *
 * `savePng` re-encodes a buffer through `sharp` to strip ancillary chunks
 * (tIME, tEXt, iTXt…) so binary output is stable across runs, then consults
 * the supplied manifests to copy the file to additional destinations.
 *
 * Used by every screenshot pipeline; the routing logic itself is owned by
 * external `*.routing.ts` manifests rather than hardcoded regex patterns.
 */
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { DESTINATION_ROOTS } from './routing/destinations.js';
import type { Locale, Manifest, Theme } from './routing/types.js';

export interface SavePngContext {
  /** Output directory for the canonical PNG (e.g. `docs/src/assets/screenshots`). */
  outputDir: string;
  /** Locale of the capture, used for filtering routes and templating. */
  locale: Locale;
  /** Theme of the capture, used for filtering routes and templating. */
  theme: Theme;
  /** Routing manifests to apply after the canonical write. */
  manifests?: Manifest[];
  /**
   * Logical capture name without locale/theme prefix (used for manifest matching).
   * Defaults to extracting the suffix after the second `-` in `filename`
   * (`{locale}-{theme}-{capture}` convention).
   */
  capture?: string;
}

/**
 * Write a PNG buffer to `<outputDir>/<filename>.png`, then copy it to every
 * destination matched by the supplied manifests.
 *
 * @param buffer - Raw PNG buffer from `page.screenshot()`.
 * @param filename - Final filename without extension. Conventionally
 *                   `{locale}-{theme}-{capture}` for `e2e-screenshots/`
 *                   or `{NNN}-{name}` for `e2e-doc-scenarios/`.
 * @param ctx - Output directory, locale, theme, and routing manifests.
 */
export async function savePng(
  buffer: Buffer,
  filename: string,
  ctx: SavePngContext,
): Promise<void> {
  fs.mkdirSync(ctx.outputDir, { recursive: true });
  const outPath = path.join(ctx.outputDir, `${filename}.png`);

  // Re-encode: sharp strips PNG metadata by default (no withMetadata() call),
  // producing byte-stable output across runs so git diff stays clean.
  await sharp(buffer).png().toFile(outPath);

  if (!ctx.manifests || ctx.manifests.length === 0) return;

  const captureName = ctx.capture ?? extractCaptureName(filename);
  if (!captureName) return;

  for (const manifest of ctx.manifests) {
    for (const route of manifest.routes) {
      if (route.capture !== captureName) continue;
      for (const destination of route.destinations) {
        if (destination.locales && !destination.locales.includes(ctx.locale)) continue;
        if (destination.themes && !destination.themes.includes(ctx.theme)) continue;

        const root = DESTINATION_ROOTS[destination.target];
        const targetPath = path.join(
          root,
          formatDestinationPath(destination.path, ctx.locale, ctx.theme),
        );
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.copyFileSync(outPath, targetPath);
      }
    }
  }
}

/**
 * Extract the logical capture name from a `{locale}-{theme}-{capture}` filename.
 * Returns null if the convention is not followed.
 */
function extractCaptureName(filename: string): string | null {
  const parts = filename.split('-');
  if (parts.length < 3) return null;
  return parts.slice(2).join('-');
}

/**
 * Resolve `{locale}` / `{theme}` placeholders inside a destination path.
 * Bare destination paths (no placeholder) are prefixed with `{locale}-{theme}-`
 * to keep the existing `doc/readme/en-dark-foo.png` layout.
 */
function formatDestinationPath(
  templatePath: string,
  locale: Locale,
  theme: Theme,
): string {
  if (templatePath.includes('{locale}') || templatePath.includes('{theme}')) {
    return templatePath
      .replace(/\{locale\}/g, locale)
      .replace(/\{theme\}/g, theme);
  }
  return `${locale}-${theme}-${templatePath}`;
}
