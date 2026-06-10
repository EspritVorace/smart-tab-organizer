// Generate the per-locale OpenGraph / social preview images (1200x630).
//
// Each image composites the popup screenshot on a brand-colored canvas with the
// localized hero tagline, so unfurls on Product Hunt, X, Reddit and Hacker News
// lead with the differentiator. Output: docs/public/og/{en,fr,es}.png (served
// verbatim, stable absolute URLs referenced from Head.astro).
//
// Run from the docs/ folder: `node scripts/generate-og-images.mjs`
//
// Follow-up idea (out of scope here): wire this into the build so the images
// regenerate automatically when the taglines or screenshots change.

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const screenshotsDir = resolve(root, 'src/assets/screenshots');
const outDir = resolve(root, 'public/og');

const WIDTH = 1200;
const HEIGHT = 630;

// Brand palette (light theme), mirrors src/styles/global.css.
const BG = '#f7f9f7';
const FG = '#1a2e1a';
const ACCENT = '#1e7a35';
const MUTED = '#dceedd';
const BORDER = '#b8d4bc';

const SHOT_W = 408; // displayed width of the popup screenshot card

const locales = {
  en: {
    headline: ['Your tabs sort and', 'name themselves.'],
    subline: 'No cloud. No AI. No tracking.',
  },
  fr: {
    headline: ['Vos onglets se rangent', 'et se nomment tout seuls.'],
    subline: 'Sans cloud. Sans IA. Sans tracking.',
  },
  es: {
    headline: ['Tus pestañas se ordenan', 'y se nombran solas.'],
    subline: 'Sin nube. Sin IA. Sin tracking.',
  },
};

const escapeXml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildSvg({ headline, subline }) {
  const cardX = WIDTH - SHOT_W - 70;
  const cardY = (HEIGHT - 414) / 2;
  const headlineLines = headline
    .map(
      (line, i) =>
        `<text x="70" y="${250 + i * 70}" font-size="58" font-weight="700" fill="${FG}">${escapeXml(line)}</text>`,
    )
    .join('\n    ');

  return Buffer.from(
    `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}"/>
    <rect x="0" y="0" width="14" height="${HEIGHT}" fill="${ACCENT}"/>
    <text x="70" y="120" font-size="34" font-weight="700" fill="${ACCENT}" font-family="sans-serif">SmartTab Organizer</text>
    <g font-family="sans-serif">
    ${headlineLines}
    </g>
    <text x="70" y="430" font-size="30" font-weight="600" fill="${ACCENT}" font-family="sans-serif">${escapeXml(subline)}</text>
    <text x="70" y="560" font-size="24" fill="${FG}" font-family="sans-serif" opacity="0.7">docs.esprit-vorace.fr</text>
    <rect x="${cardX - 16}" y="${cardY - 16}" width="${SHOT_W + 32}" height="446" rx="20" fill="${MUTED}" stroke="${BORDER}" stroke-width="2"/>
  </svg>`,
    'utf-8',
  );
}

async function main() {
  await mkdir(outDir, { recursive: true });

  for (const [locale, copy] of Object.entries(locales)) {
    const shotPath = resolve(
      screenshotsDir,
      `${locale}-light-journey-popup-with-pinned-and-workspace.png`,
    );
    const shot = await sharp(shotPath)
      .resize({ width: SHOT_W })
      .toBuffer();
    const shotMeta = await sharp(shot).metadata();

    const cardX = WIDTH - SHOT_W - 70;
    const cardY = (HEIGHT - 414) / 2;
    const shotTop = Math.round(cardY + (414 - shotMeta.height) / 2);

    const out = resolve(outDir, `${locale}.png`);
    await sharp(buildSvg(copy))
      .composite([{ input: shot, left: cardX, top: shotTop }])
      .png()
      .toFile(out);
    console.log(`og: ${out} (${shotMeta.width}x${shotMeta.height} shot)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
