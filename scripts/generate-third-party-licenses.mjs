#!/usr/bin/env node
/**
 * Generates the open source attribution artifacts, scoped to the packages whose
 * code actually ends up in the extension bundle:
 *
 *   public/data/third-party-licenses.json   (chips data, fetched by AboutDialog)
 *   public/data/third-party-licenses.txt    (full NOTICE, bundled, linked from AboutDialog)
 *   THIRD-PARTY-LICENSES.txt                 (same NOTICE, at repo root, visible on GitHub)
 *   docs/src/content/docs/reference/licences-open-source.mdx        (FR, root)
 *   docs/src/content/docs/en/reference/licences-open-source.mdx     (EN)
 *   docs/src/content/docs/es/reference/licences-open-source.mdx     (ES)
 *
 * The attributed set comes from scripts/bundled-dependencies.json, a manifest
 * written by the `build:done` hook in wxt.config.ts (rollup-plugin-license
 * reports the third-party code present in each bundle). Only redistributed code
 * is attributed: development tooling is not shipped, so it is not listed.
 *
 * The verbatim license texts (MIT, BSD, ISC, Apache, ...) are reproduced in the
 * .txt NOTICE because permissive licenses require preserving the copyright and
 * permission notice on redistribution.
 *
 * Workflow: run `pnpm build` to refresh the manifest, then `pnpm licenses:generate`.
 *
 * Idempotent: deterministic ordering, no timestamps. Compatible with Node 22
 * (plain ESM, no TypeScript imports, no experimental flags).
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const checker = require('license-checker-rseidelsohn');
const pkg = require('../package.json');

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

const SELF_PACKAGE = 'smart-tab-organizer';
const BUNDLED_MANIFEST = join(PROJECT_ROOT, 'scripts', 'bundled-dependencies.json');

// Names listed directly in package.json. These drive the (curated) "Built with"
// chips in the About dialog; the legal attribution below is scoped to the
// actual bundle instead.
const RUNTIME_DIRECT = new Set(Object.keys(pkg.dependencies || {}));
const DEV_DIRECT = new Set(Object.keys(pkg.devDependencies || {}));
const DIRECT_DEPENDENCIES = new Set([...RUNTIME_DIRECT, ...DEV_DIRECT]);

const LOCALES = /** @type {const} */ (['fr', 'en', 'es']);

const DOC_OUTPUT_PATHS = {
  fr: 'docs/src/content/docs/reference/licences-open-source.mdx',
  en: 'docs/src/content/docs/en/reference/licences-open-source.mdx',
  es: 'docs/src/content/docs/es/reference/licences-open-source.mdx',
};

// Strings authored by us (never reproduced from a third party), so they must
// stay free of em-dash and en-dash per the project writing-style rule.
const LOCALE_STRINGS = {
  fr: {
    title: 'Licences open source',
    description:
      'Attribution des composants open source embarqués dans SmartTab Organizer et leurs licences.',
    generated:
      'Cette page est générée depuis le contenu du bundle. Lancez pnpm licenses:generate pour la mettre à jour.',
    intro:
      "SmartTab Organizer est distribué sous licence GPLv3. L'extension embarque les composants open source listés ci-dessous, avec leur licence. Les textes de licence complets sont fournis dans le fichier THIRD-PARTY-LICENSES.txt.",
    heading: 'Composants embarqués',
    colPackage: 'Paquet',
    colVersion: 'Version',
    colLicense: 'Licence',
    colRepo: 'Dépôt',
    noticeNote:
      "Les textes de licence intégraux sont disponibles dans THIRD-PARTY-LICENSES.txt (à la racine du dépôt) et embarqués dans l'extension.",
  },
  en: {
    title: 'Open source licenses',
    description:
      'Attribution of the open source components bundled in SmartTab Organizer and their licenses.',
    generated:
      'This page is generated from the bundle contents. Run pnpm licenses:generate to update it.',
    intro:
      'SmartTab Organizer is distributed under the GPLv3 license. The extension bundles the open source components listed below, with their license. The full license texts are provided in the THIRD-PARTY-LICENSES.txt file.',
    heading: 'Bundled components',
    colPackage: 'Package',
    colVersion: 'Version',
    colLicense: 'License',
    colRepo: 'Repository',
    noticeNote:
      'The full license texts are available in THIRD-PARTY-LICENSES.txt (at the repository root) and bundled inside the extension.',
  },
  es: {
    title: 'Licencias de codigo abierto',
    description:
      'Atribucion de los componentes de codigo abierto incluidos en SmartTab Organizer y sus licencias.',
    generated:
      'Esta pagina se genera desde el contenido del paquete. Ejecuta pnpm licenses:generate para actualizarla.',
    intro:
      'SmartTab Organizer se distribuye bajo la licencia GPLv3. La extension incluye los componentes de codigo abierto listados a continuacion, con su licencia. Los textos completos de las licencias estan en el archivo THIRD-PARTY-LICENSES.txt.',
    heading: 'Componentes incluidos',
    colPackage: 'Paquete',
    colVersion: 'Version',
    colLicense: 'Licencia',
    colRepo: 'Repositorio',
    noticeNote:
      'Los textos completos de las licencias estan disponibles en THIRD-PARTY-LICENSES.txt (en la raiz del repositorio) e incluidos dentro de la extension.',
  },
};

/**
 * Promisified wrapper around license-checker-rseidelsohn.
 * @param {Record<string, unknown>} options
 * @returns {Promise<Record<string, any>>}
 */
function runChecker(options) {
  return new Promise((resolve, reject) => {
    checker.init(options, (err, packages) => {
      if (err) reject(err);
      else resolve(packages);
    });
  });
}

/** Split a "name@version" key, accounting for scoped packages (@scope/name@version). */
function splitNameVersion(key) {
  const at = key.lastIndexOf('@');
  return { name: key.slice(0, at), version: key.slice(at + 1) };
}

function normalizeLicense(licenses) {
  if (Array.isArray(licenses)) return licenses.join(', ');
  return licenses || 'UNKNOWN';
}

function normalizeRepository(repository) {
  if (!repository) return '';
  return repository.replace(/^git\+/, '').replace(/\.git$/, '');
}

async function collectDependencies() {
  const customFormat = {
    name: '',
    version: '',
    licenses: '',
    repository: '',
    publisher: '',
    licenseText: '',
  };

  const all = await runChecker({ start: PROJECT_ROOT, customFormat });

  const byKey = new Map();
  for (const [key, value] of Object.entries(all)) {
    const { name, version } = splitNameVersion(key);
    if (name === SELF_PACKAGE) continue;
    byKey.set(`${name}@${version}`, {
      name,
      version,
      license: normalizeLicense(value.licenses),
      publisher: value.publisher || '',
      repository: normalizeRepository(value.repository),
      licenseText: (value.licenseText || '').trim(),
      direct: DIRECT_DEPENDENCIES.has(name),
    });
  }
  return byKey;
}

/** Load the bundled-package manifest (name@version actually shipped in the bundle). */
function loadBundledManifest() {
  if (!existsSync(BUNDLED_MANIFEST)) return null;
  return JSON.parse(readFileSync(BUNDLED_MANIFEST, 'utf-8'));
}

/* --- Version grouping --------------------------------------------------- */

/** Compare two version strings numerically (semver-ish), falling back to string order. */
function compareVersions(a, b) {
  const pa = a.split('.');
  const pb = b.split('.');
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = parseInt(pa[i] ?? '0', 10);
    const y = parseInt(pb[i] ?? '0', 10);
    if (Number.isNaN(x) || Number.isNaN(y)) return a.localeCompare(b);
    if (x !== y) return x - y;
  }
  return 0;
}

function sortedVersions(versions) {
  return [...new Set(versions)].sort(compareVersions);
}

function pickLatest(list) {
  return list.reduce((acc, e) => (compareVersions(e.version, acc.version) >= 0 ? e : acc));
}

function groupByName(entries) {
  const byName = new Map();
  for (const entry of entries) {
    if (!byName.has(entry.name)) byName.set(entry.name, []);
    byName.get(entry.name).push(entry);
  }
  return byName;
}

/**
 * Group packages for the NOTICE: one block per (name, distinct license text).
 * Identical license texts across versions are merged and the versions listed
 * together. Distinct texts (a package that changed its license) stay separate,
 * so every distinct copyright/permission notice is preserved.
 */
function groupForNotice(entries) {
  const groups = [];
  for (const [name, list] of groupByName(entries)) {
    const byText = new Map();
    for (const entry of list) {
      const key = entry.licenseText ? `t:${entry.licenseText}` : `n:${entry.license}`;
      if (!byText.has(key)) byText.set(key, []);
      byText.get(key).push(entry);
    }
    for (const sub of byText.values()) {
      const latest = pickLatest(sub);
      groups.push({
        name,
        versions: sortedVersions(sub.map((e) => e.version)),
        license: latest.license,
        publisher: latest.publisher,
        repository: latest.repository,
        licenseText: latest.licenseText,
      });
    }
  }
  groups.sort((a, b) => {
    const byName = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    if (byName !== 0) return byName;
    return compareVersions(a.versions[0], b.versions[0]);
  });
  return groups;
}

/** Group packages for the documentation table: one row per name, versions joined. */
function groupForTable(entries) {
  const groups = [];
  for (const [name, list] of groupByName(entries)) {
    const latest = pickLatest(list);
    groups.push({
      name,
      versions: sortedVersions(list.map((e) => e.version)),
      license: [...new Set(list.map((e) => e.license))].join(', '),
      repository: latest.repository,
    });
  }
  groups.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  return groups;
}

/* --- Artifact builders ------------------------------------------------- */

function buildJson(byKey) {
  // licenseText is intentionally omitted to keep this asset light; it is only
  // used to render the credits chips in the About dialog. Only direct
  // dependencies (those listed in package.json) are kept here, deduplicated by
  // name and scoped by their package.json section (runtime = Bundled, dev = Dev
  // tools). The full bundle attribution lives in the NOTICE files.
  const byName = new Map();
  for (const entry of byKey.values()) {
    if (!entry.direct || byName.has(entry.name)) continue;
    byName.set(entry.name, {
      name: entry.name,
      version: entry.version,
      license: entry.license,
      publisher: entry.publisher,
      repository: entry.repository,
      scope: RUNTIME_DIRECT.has(entry.name) ? 'prod' : 'dev',
    });
  }
  return JSON.stringify([...byName.values()], null, 2) + '\n';
}

function buildNotice(entries) {
  const line = '='.repeat(78);
  let out = '';
  out += `${line}\n`;
  out += 'SmartTab Organizer - Third-party licenses\n';
  out += `${line}\n\n`;
  out +=
    'SmartTab Organizer is distributed under the GNU General Public License v3.0\n' +
    '(see LICENSE.txt). The open source components listed below are bundled in the\n' +
    'extension package. Their copyright notices and license texts are reproduced\n' +
    'verbatim, as required by their respective licenses.\n\n';

  for (const group of groupForNotice(entries)) {
    const versions = group.versions.join(', ');
    out += `${line}\n`;
    out += `${group.name} ${versions}\n`;
    out += `License: ${group.license}\n`;
    if (group.publisher) out += `Author: ${group.publisher}\n`;
    if (group.repository) out += `Repository: ${group.repository}\n`;
    out += `${line}\n\n`;
    if (group.licenseText) {
      out += `${group.licenseText}\n\n`;
    } else {
      out += `License: ${group.license} (no license file shipped by this package).\n\n`;
    }
  }

  return out;
}

function escapeTableCell(value) {
  return String(value).replace(/\|/g, '\\|');
}

function renderTable(entries, strings) {
  const header =
    `| ${strings.colPackage} | ${strings.colVersion} | ${strings.colLicense} | ${strings.colRepo} |\n` +
    '| --- | --- | --- | --- |\n';
  const rows = groupForTable(entries)
    .map((group) => {
      const repo = group.repository
        ? `[${escapeTableCell(group.repository.replace(/^https?:\/\//, ''))}](${group.repository})`
        : '';
      return (
        `| ${escapeTableCell(group.name)} ` +
        `| ${escapeTableCell(group.versions.join(', '))} ` +
        `| ${escapeTableCell(group.license)} ` +
        `| ${repo} |`
      );
    })
    .join('\n');
  return header + rows + '\n';
}

function buildDocPage(entries, locale) {
  const strings = LOCALE_STRINGS[locale];

  let md = '---\n';
  md += `title: ${strings.title}\n`;
  md += `description: ${strings.description}\n`;
  md += '---\n\n';
  md += `{/* ${strings.generated} */}\n\n`;
  md += `${strings.intro}\n\n`;

  md += `## ${strings.heading}\n\n`;
  md += renderTable(entries, strings) + '\n';

  md += `:::note\n${strings.noticeNote}\n:::\n`;

  return md;
}

/* --- IO ----------------------------------------------------------------- */

function writeFile(absPath, contents) {
  mkdirSync(dirname(absPath), { recursive: true });
  writeFileSync(absPath, contents, 'utf-8');
}

async function main() {
  const manifest = loadBundledManifest();
  if (!manifest) {
    process.stderr.write(
      'No scripts/bundled-dependencies.json found. Run `pnpm build` first to capture ' +
        'the bundled packages, then re-run `pnpm licenses:generate`. Skipping.\n',
    );
    return;
  }

  const byKey = await collectDependencies();

  // Resolve every bundled package against the installed metadata. A bundled
  // package must always be attributed, so fall back to a minimal entry if the
  // license checker did not surface it.
  const bundledEntries = manifest.map(({ name, version }) => {
    const entry = byKey.get(`${name}@${version}`);
    if (entry) return entry;
    return { name, version, license: 'UNKNOWN', publisher: '', repository: '', licenseText: '' };
  });

  const json = buildJson(byKey);
  const notice = buildNotice(bundledEntries);

  const jsonPath = join(PROJECT_ROOT, 'public', 'data', 'third-party-licenses.json');
  const bundledNoticePath = join(PROJECT_ROOT, 'public', 'data', 'third-party-licenses.txt');
  const rootNoticePath = join(PROJECT_ROOT, 'THIRD-PARTY-LICENSES.txt');

  writeFile(jsonPath, json);
  writeFile(bundledNoticePath, notice);
  writeFile(rootNoticePath, notice);

  process.stdout.write(`Generated public/data/third-party-licenses.json (chips)\n`);
  process.stdout.write(`Generated public/data/third-party-licenses.txt (${bundledEntries.length} bundled packages)\n`);
  process.stdout.write(`Generated THIRD-PARTY-LICENSES.txt (${bundledEntries.length} bundled packages)\n`);

  for (const locale of LOCALES) {
    const md = buildDocPage(bundledEntries, locale);
    writeFile(join(PROJECT_ROOT, DOC_OUTPUT_PATHS[locale]), md);
    process.stdout.write(`Generated ${DOC_OUTPUT_PATHS[locale]}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
