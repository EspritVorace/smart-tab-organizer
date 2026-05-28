#!/usr/bin/env node
/**
 * Generates the open source attribution artifacts for the extension and the
 * documentation site, from the actually installed dependency tree:
 *
 *   public/data/third-party-licenses.json   (chips data, fetched by AboutDialog)
 *   public/data/third-party-licenses.txt    (full NOTICE, bundled, linked from AboutDialog)
 *   THIRD-PARTY-LICENSES.txt                 (same NOTICE, at repo root, visible on GitHub)
 *   docs/src/content/docs/reference/licences-open-source.mdx        (FR, root)
 *   docs/src/content/docs/en/reference/licences-open-source.mdx     (EN)
 *   docs/src/content/docs/es/reference/licences-open-source.mdx     (ES)
 *
 * Every installed dependency is included and tagged with its scope:
 *   "prod" (runtime, shipped in the bundle) or "dev" (build/test tooling).
 *
 * The verbatim license texts (MIT, BSD, ISC, Apache, ...) are reproduced in the
 * .txt NOTICE because permissive licenses require preserving the copyright and
 * permission notice on redistribution.
 *
 * Idempotent: deterministic ordering, no timestamps. Run via
 * `pnpm licenses:generate` (also wired as a `prebuild` step). Compatible with
 * Node 22 (plain ESM, no TypeScript imports, no experimental flags).
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const checker = require('license-checker-rseidelsohn');
const pkg = require('../package.json');

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

const SELF_PACKAGE = 'smart-tab-organizer';

// Names listed directly in package.json. Only these are surfaced as chips in
// the About dialog; the full transitive tree stays in the NOTICE files and the
// documentation page. For direct dependencies we trust the package.json section
// (runtime vs dev) rather than the transitive scope computed by the checker.
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
      'Attribution des composants open source utilisés par SmartTab Organizer et leurs licences.',
    generated:
      'Cette page est générée depuis package.json. Lancez pnpm licenses:generate pour la mettre à jour.',
    intro:
      "SmartTab Organizer est distribué sous licence GPLv3. L'extension embarque des composants open source tiers, listés ci-dessous avec leur licence. Les textes de licence complets sont fournis dans le fichier THIRD-PARTY-LICENSES.txt.",
    runtimeHeading: 'Dépendances embarquées',
    runtimeIntro:
      'Bibliothèques incluses dans le bundle distribué de l\'extension.',
    devHeading: 'Outils de développement',
    devIntro:
      'Outils utilisés pour développer, tester et construire le projet (non distribués dans l\'extension).',
    colPackage: 'Paquet',
    colVersion: 'Version',
    colLicense: 'Licence',
    colRepo: 'Dépôt',
    noticeNote:
      'Les textes de licence intégraux sont disponibles dans THIRD-PARTY-LICENSES.txt (à la racine du dépôt) et embarqués dans l\'extension.',
  },
  en: {
    title: 'Open source licenses',
    description:
      'Attribution of the open source components used by SmartTab Organizer and their licenses.',
    generated:
      'This page is generated from package.json. Run pnpm licenses:generate to update it.',
    intro:
      'SmartTab Organizer is distributed under the GPLv3 license. The extension bundles third-party open source components, listed below with their license. The full license texts are provided in the THIRD-PARTY-LICENSES.txt file.',
    runtimeHeading: 'Bundled dependencies',
    runtimeIntro: 'Libraries included in the distributed extension bundle.',
    devHeading: 'Development tools',
    devIntro:
      'Tools used to develop, test and build the project (not shipped in the extension).',
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
      'Atribucion de los componentes de codigo abierto usados por SmartTab Organizer y sus licencias.',
    generated:
      'Esta pagina se genera desde package.json. Ejecuta pnpm licenses:generate para actualizarla.',
    intro:
      'SmartTab Organizer se distribuye bajo la licencia GPLv3. La extension incluye componentes de codigo abierto de terceros, listados a continuacion con su licencia. Los textos completos de las licencias estan en el archivo THIRD-PARTY-LICENSES.txt.',
    runtimeHeading: 'Dependencias incluidas',
    runtimeIntro: 'Bibliotecas incluidas en el paquete distribuido de la extension.',
    devHeading: 'Herramientas de desarrollo',
    devIntro:
      'Herramientas usadas para desarrollar, probar y construir el proyecto (no incluidas en la extension).',
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

  const [all, prod] = await Promise.all([
    runChecker({ start: PROJECT_ROOT, customFormat }),
    runChecker({ start: PROJECT_ROOT, production: true, customFormat }),
  ]);

  const prodKeys = new Set(Object.keys(prod));

  const entries = Object.entries(all)
    .map(([key, value]) => {
      const { name, version } = splitNameVersion(key);
      return {
        name,
        version,
        license: normalizeLicense(value.licenses),
        publisher: value.publisher || '',
        repository: normalizeRepository(value.repository),
        licenseText: (value.licenseText || '').trim(),
        scope: prodKeys.has(key) ? 'prod' : 'dev',
        direct: DIRECT_DEPENDENCIES.has(name),
      };
    })
    .filter((entry) => entry.name !== SELF_PACKAGE);

  entries.sort((a, b) => {
    const byName = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    if (byName !== 0) return byName;
    return a.version.localeCompare(b.version);
  });

  return entries;
}

/* --- Artifact builders ------------------------------------------------- */

function buildJson(entries) {
  // licenseText is intentionally omitted to keep this asset light; it is only
  // used to render the credits chips in the About dialog. Only direct
  // dependencies (those listed in package.json) are kept here, so the About
  // dialog stays readable; the full transitive tree lives in the NOTICE files.
  // Deduplicated by name (a package can be installed in several versions) and
  // scoped by its package.json section (runtime = Bundled, dev = Dev tools).
  const byName = new Map();
  for (const entry of entries) {
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
  const data = [...byName.values()];
  return JSON.stringify(data, null, 2) + '\n';
}

function buildNotice(entries) {
  const line = '='.repeat(78);
  let out = '';
  out += `${line}\n`;
  out += 'SmartTab Organizer - Third-party licenses\n';
  out += `${line}\n\n`;
  out +=
    'SmartTab Organizer is distributed under the GNU General Public License v3.0\n' +
    '(see LICENSE.txt). It bundles the third-party open source components listed\n' +
    'below. Their copyright notices and license texts are reproduced verbatim, as\n' +
    'required by their respective licenses.\n\n';
  out += 'Scope: [prod] = shipped in the extension bundle, [dev] = build/test tooling.\n\n';

  for (const entry of entries) {
    out += `${line}\n`;
    out += `${entry.name} ${entry.version}  [${entry.scope}]\n`;
    out += `License: ${entry.license}\n`;
    if (entry.publisher) out += `Author: ${entry.publisher}\n`;
    if (entry.repository) out += `Repository: ${entry.repository}\n`;
    out += `${line}\n\n`;
    if (entry.licenseText) {
      out += `${entry.licenseText}\n\n`;
    } else {
      out += `License: ${entry.license} (no license file shipped by this package).\n\n`;
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
  const rows = entries
    .map((entry) => {
      const repo = entry.repository
        ? `[${escapeTableCell(entry.repository.replace(/^https?:\/\//, ''))}](${entry.repository})`
        : '';
      return (
        `| ${escapeTableCell(entry.name)} ` +
        `| ${escapeTableCell(entry.version)} ` +
        `| ${escapeTableCell(entry.license)} ` +
        `| ${repo} |`
      );
    })
    .join('\n');
  return header + rows + '\n';
}

function buildDocPage(entries, locale) {
  const strings = LOCALE_STRINGS[locale];
  const runtime = entries.filter((e) => e.scope === 'prod');
  const dev = entries.filter((e) => e.scope === 'dev');

  let md = '---\n';
  md += `title: ${strings.title}\n`;
  md += `description: ${strings.description}\n`;
  md += '---\n\n';
  md += `{/* ${strings.generated} */}\n\n`;
  md += `${strings.intro}\n\n`;

  md += `## ${strings.runtimeHeading}\n\n`;
  md += `${strings.runtimeIntro}\n\n`;
  md += renderTable(runtime, strings) + '\n';

  md += `## ${strings.devHeading}\n\n`;
  md += `${strings.devIntro}\n\n`;
  md += renderTable(dev, strings) + '\n';

  md += `:::note\n${strings.noticeNote}\n:::\n`;

  return md;
}

/* --- IO ----------------------------------------------------------------- */

function writeFile(absPath, contents) {
  mkdirSync(dirname(absPath), { recursive: true });
  writeFileSync(absPath, contents, 'utf-8');
}

async function main() {
  const entries = await collectDependencies();

  const json = buildJson(entries);
  const notice = buildNotice(entries);

  const jsonPath = join(PROJECT_ROOT, 'public', 'data', 'third-party-licenses.json');
  const bundledNoticePath = join(PROJECT_ROOT, 'public', 'data', 'third-party-licenses.txt');
  const rootNoticePath = join(PROJECT_ROOT, 'THIRD-PARTY-LICENSES.txt');

  writeFile(jsonPath, json);
  writeFile(bundledNoticePath, notice);
  writeFile(rootNoticePath, notice);

  process.stdout.write(`Generated public/data/third-party-licenses.json (${entries.length} packages)\n`);
  process.stdout.write('Generated public/data/third-party-licenses.txt\n');
  process.stdout.write('Generated THIRD-PARTY-LICENSES.txt\n');

  for (const locale of LOCALES) {
    const md = buildDocPage(entries, locale);
    writeFile(join(PROJECT_ROOT, DOC_OUTPUT_PATHS[locale]), md);
    process.stdout.write(`Generated ${DOC_OUTPUT_PATHS[locale]}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
