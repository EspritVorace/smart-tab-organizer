#!/usr/bin/env node
/**
 * Generates the Starlight reference page documenting the import / export
 * JSON format, in three locales. The schema structure (types, enums,
 * required, defaults) is derived from the very same source that powers the
 * in-editor tooltips of `JsonCodeEditor`: the JSON Schemas built in
 * `src/utils/importJsonSchemas.ts` from the runtime Zod schemas. Field
 * descriptions are resolved per locale from `public/_locales`.
 *
 * The schemas are loaded through `scripts/json-schema-doc/loader.mjs`,
 * whose i18n stub makes every documented property carry
 * `description === <i18n key>`; this script then maps each key to its
 * localized text.
 *
 * All three locales share the FR-rooted slug
 * `reference/schema-json-import-export` so Starlight i18n routing resolves
 * them automatically:
 *
 *   docs/src/content/docs/reference/schema-json-import-export.mdx        (FR, root)
 *   docs/src/content/docs/en/reference/schema-json-import-export.mdx     (EN)
 *   docs/src/content/docs/es/reference/schema-json-import-export.mdx     (ES)
 *
 * Idempotent: deterministic iteration order, no timestamps. Run via
 * `pnpm json-schema:doc`.
 */

import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  rulesImportJsonSchema,
  sessionsImportJsonSchema,
  workspaceImportJsonSchema,
} from '../src/utils/importJsonSchemas.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

const LOCALES = /** @type {const} */ (['fr', 'en', 'es']);

const OUTPUT_PATHS = {
  fr: 'docs/src/content/docs/reference/schema-json-import-export.mdx',
  en: 'docs/src/content/docs/en/reference/schema-json-import-export.mdx',
  es: 'docs/src/content/docs/es/reference/schema-json-import-export.mdx',
};

/**
 * Page "chrome" strings kept in-script (rather than in the extension i18n
 * bundle) since they are purely documentation labels. The field
 * descriptions themselves come from `public/_locales`.
 */
const STRINGS = {
  fr: {
    title: "Schéma JSON d'import / export",
    description:
      "Référence des champs du format JSON utilisé pour importer et exporter les règles, les sessions et les espaces de travail.",
    generated:
      'Cette page est générée depuis src/utils/importJsonSchemas.ts. Lancez pnpm json-schema:doc pour la mettre à jour.',
    intro:
      "Cette page documente le format JSON accepté par l'assistant d'import / export. Les mêmes descriptions sont affichées en infobulle dans l'éditeur de l'extension. Les champs marqués comme requis doivent être présents ; les autres sont facultatifs.",
    objectsHeading: 'Objets',
    objectsIntro:
      "Les formats ci-dessus référencent les objets détaillés ici.",
    formatRules: 'Export de règles',
    formatSessions: 'Export de sessions',
    formatWorkspace: "Export d'espace de travail",
    objRule: 'Objet règle de domaine',
    objSession: 'Objet session',
    objGroup: "Objet groupe d'onglets",
    objTab: 'Objet onglet',
    objWorkspaceMeta: "Métadonnées d'espace de travail",
    objSettings: 'Paramètres',
    objStatistics: 'Statistiques',
    colField: 'Champ',
    colType: 'Type',
    colRequired: 'Requis',
    colDescription: 'Description',
    yes: 'Oui',
    no: 'Non',
    enumLabel: 'valeurs',
    arrayOf: 'tableau de',
    arrayOfObjects: "tableau d'objets",
    nullable: 'nullable',
    default: 'défaut',
  },
  en: {
    title: 'Import / export JSON schema',
    description:
      'Reference of the JSON format fields used to import and export rules, sessions and workspaces.',
    generated:
      'This page is generated from src/utils/importJsonSchemas.ts. Run pnpm json-schema:doc to update it.',
    intro:
      "This page documents the JSON format accepted by the import / export wizard. The same descriptions appear as tooltips in the extension editor. Fields marked as required must be present; the others are optional.",
    objectsHeading: 'Objects',
    objectsIntro: 'The formats above reference the objects detailed here.',
    formatRules: 'Rules export',
    formatSessions: 'Sessions export',
    formatWorkspace: 'Workspace export',
    objRule: 'Domain rule object',
    objSession: 'Session object',
    objGroup: 'Tab group object',
    objTab: 'Tab object',
    objWorkspaceMeta: 'Workspace metadata',
    objSettings: 'Settings',
    objStatistics: 'Statistics',
    colField: 'Field',
    colType: 'Type',
    colRequired: 'Required',
    colDescription: 'Description',
    yes: 'Yes',
    no: 'No',
    enumLabel: 'values',
    arrayOf: 'array of',
    arrayOfObjects: 'array of objects',
    nullable: 'nullable',
    default: 'default',
  },
  es: {
    title: 'Esquema JSON de importación / exportación',
    description:
      'Referencia de los campos del formato JSON usado para importar y exportar reglas, sesiones y espacios de trabajo.',
    generated:
      'Esta página se genera a partir de src/utils/importJsonSchemas.ts. Ejecuta pnpm json-schema:doc para actualizarla.',
    intro:
      'Esta página documenta el formato JSON aceptado por el asistente de importación / exportación. Las mismas descripciones aparecen como información sobre herramientas en el editor de la extensión. Los campos marcados como requeridos deben estar presentes; los demás son opcionales.',
    objectsHeading: 'Objetos',
    objectsIntro: 'Los formatos anteriores hacen referencia a los objetos detallados aquí.',
    formatRules: 'Exportación de reglas',
    formatSessions: 'Exportación de sesiones',
    formatWorkspace: 'Exportación de espacio de trabajo',
    objRule: 'Objeto regla de dominio',
    objSession: 'Objeto sesión',
    objGroup: 'Objeto grupo de pestañas',
    objTab: 'Objeto pestaña',
    objWorkspaceMeta: 'Metadatos del espacio de trabajo',
    objSettings: 'Ajustes',
    objStatistics: 'Estadísticas',
    colField: 'Campo',
    colType: 'Tipo',
    colRequired: 'Requerido',
    colDescription: 'Descripción',
    yes: 'Sí',
    no: 'No',
    enumLabel: 'valores',
    arrayOf: 'arreglo de',
    arrayOfObjects: 'arreglo de objetos',
    nullable: 'nullable',
    default: 'predeterminado',
  },
};

function loadMessages(locale) {
  const path = join(PROJECT_ROOT, 'public', '_locales', locale, 'messages.json');
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function makeT(messages) {
  return (key) => messages[key]?.message ?? key;
}

function escapeTableCell(value) {
  // Escape backslashes first, then the Markdown table cell delimiter, so the
  // escaping stays complete even if a description ever contains a backslash.
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
}

/** Human-readable type cell for a JSON-schema property node. */
function formatType(node, s) {
  let label;

  if (Array.isArray(node.enum) && node.enum.length > 0) {
    label = `${s.enumLabel}: ${node.enum.map((v) => `\`${v}\``).join(', ')}`;
  } else if (Array.isArray(node.anyOf)) {
    const types = node.anyOf
      .map((branch) => branch.type)
      .flat()
      .filter((t) => t !== undefined);
    const nonNull = [...new Set(types.filter((t) => t !== 'null'))];
    label = nonNull.join(' | ') || 'any';
    if (types.includes('null')) label += ` (${s.nullable})`;
  } else if (Array.isArray(node.type)) {
    const nonNull = node.type.filter((t) => t !== 'null');
    label = nonNull.join(' | ');
    if (node.type.includes('null')) label += ` (${s.nullable})`;
  } else if (node.type === 'array') {
    const itemType = node.items?.type;
    if (itemType === 'object') label = s.arrayOfObjects;
    else if (typeof itemType === 'string') label = `${s.arrayOf} ${itemType}`;
    else label = 'array';
  } else {
    label = node.type ?? 'object';
  }

  if (node.default !== undefined) {
    label += ` (${s.default}: \`${JSON.stringify(node.default)}\`)`;
  }

  return label;
}

/**
 * Renders a Markdown table for an object schema node, listing only the
 * properties that carry a description (the documented ones), in schema
 * definition order.
 */
function renderObjectTable(objectNode, t, s) {
  const properties = objectNode?.properties ?? {};
  const required = new Set(objectNode?.required ?? []);

  const rows = Object.entries(properties)
    .filter(([, node]) => node && typeof node.description === 'string')
    .map(([key, node]) => {
      const type = escapeTableCell(formatType(node, s));
      const req = required.has(key) ? s.yes : s.no;
      const desc = escapeTableCell(t(node.description));
      return `| \`${key}\` | ${type} | ${req} | ${desc} |`;
    });

  if (rows.length === 0) return '';

  const header =
    `| ${s.colField} | ${s.colType} | ${s.colRequired} | ${s.colDescription} |\n` +
    '| --- | --- | --- | --- |\n';
  return header + rows.join('\n') + '\n';
}

function renderSection(level, title, intro, table) {
  let md = `${'#'.repeat(level)} ${title}\n\n`;
  if (intro) md += `${intro}\n\n`;
  if (table) md += `${table}\n`;
  return md;
}

function renderForLocale(locale) {
  const t = makeT(loadMessages(locale));
  const s = STRINGS[locale];

  // Shared object nodes (each documented once under "Objects").
  const ruleObject = rulesImportJsonSchema.properties.domainRules.items;
  const sessionObject = sessionsImportJsonSchema.properties.sessions.items;
  const groupObject = sessionObject.properties.groups.items;
  const tabObject = groupObject.properties.tabs.items;
  const workspaceMeta = workspaceImportJsonSchema.properties.workspace;
  const settingsObject = workspaceImportJsonSchema.properties.settings;
  const statisticsObject = workspaceImportJsonSchema.properties.statistics;

  let md = '---\n';
  md += `title: ${s.title}\n`;
  md += `description: ${s.description}\n`;
  md += '---\n\n';
  md += `{/* ${s.generated} */}\n\n`;
  md += `${s.intro}\n\n`;

  // Top-level formats.
  md += renderSection(2, s.formatRules, null, renderObjectTable(rulesImportJsonSchema, t, s));
  md += renderSection(2, s.formatSessions, null, renderObjectTable(sessionsImportJsonSchema, t, s));
  md += renderSection(2, s.formatWorkspace, null, renderObjectTable(workspaceImportJsonSchema, t, s));

  // Referenced objects.
  md += renderSection(2, s.objectsHeading, s.objectsIntro, '');
  md += renderSection(3, s.objRule, null, renderObjectTable(ruleObject, t, s));
  md += renderSection(3, s.objSession, null, renderObjectTable(sessionObject, t, s));
  md += renderSection(3, s.objGroup, null, renderObjectTable(groupObject, t, s));
  md += renderSection(3, s.objTab, null, renderObjectTable(tabObject, t, s));
  md += renderSection(3, s.objWorkspaceMeta, null, renderObjectTable(workspaceMeta, t, s));
  md += renderSection(3, s.objSettings, null, renderObjectTable(settingsObject, t, s));
  md += renderSection(3, s.objStatistics, null, renderObjectTable(statisticsObject, t, s));

  return md.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

function writeFile(absPath, contents) {
  mkdirSync(dirname(absPath), { recursive: true });
  writeFileSync(absPath, contents, 'utf-8');
}

function main() {
  for (const locale of LOCALES) {
    const md = renderForLocale(locale);
    const absPath = join(PROJECT_ROOT, OUTPUT_PATHS[locale]);
    writeFile(absPath, md);
    process.stdout.write(`Generated ${OUTPUT_PATHS[locale]}\n`);
  }
}

main();
