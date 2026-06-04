#!/usr/bin/env node
/**
 * Generates the Starlight reference page that lists every keyboard shortcut
 * declared in `src/shortcuts/registry.ts`, in three locales. All three
 * locales share the FR-rooted slug `reference/raccourcis-clavier` so
 * Starlight's i18n routing can resolve them automatically:
 *
 *   docs/src/content/docs/reference/raccourcis-clavier.mdx        (FR, root)
 *   docs/src/content/docs/en/reference/raccourcis-clavier.mdx     (EN)
 *   docs/src/content/docs/es/reference/raccourcis-clavier.mdx     (ES)
 *
 * Idempotent: deterministic iteration order, no timestamps. Run via
 * `pnpm shortcuts:doc`.
 */

import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SHORTCUTS_REGISTRY } from '../src/shortcuts/registry.ts';
import { GROUP_DESCRIPTORS, getDisplayTree } from '../src/shortcuts/groups.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

const LOCALES = /** @type {const} */ (['fr', 'en', 'es']);

const OUTPUT_PATHS = {
  fr: 'docs/src/content/docs/reference/raccourcis-clavier.mdx',
  en: 'docs/src/content/docs/en/reference/raccourcis-clavier.mdx',
  es: 'docs/src/content/docs/es/reference/raccourcis-clavier.mdx',
};

const SEQUENCE_JOIN = { fr: 'puis', en: 'then', es: 'luego' };
const ALT_JOIN = { fr: 'ou', en: 'or', es: 'o' };

const ARROW_KEYS = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
};

function loadMessages(locale) {
  const path = join(PROJECT_ROOT, 'public', '_locales', locale, 'messages.json');
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw);
}

function makeT(messages) {
  return (key) => messages[key]?.message ?? key;
}

function formatKey(token) {
  if (ARROW_KEYS[token]) return ARROW_KEYS[token];
  if (token.length === 1 && /[a-z]/.test(token)) return token.toUpperCase();
  return token;
}

function formatCombo(combo) {
  return combo.split('+').map(formatKey).join(' + ');
}

function formatBinding(binding, locale) {
  if (typeof binding === 'string') {
    return '`' + formatCombo(binding) + '`';
  }
  return binding.map((step) => '`' + formatCombo(step) + '`').join(` ${SEQUENCE_JOIN[locale]} `);
}

function formatBindings(bindings, locale) {
  return bindings.map((b) => formatBinding(b, locale)).join(` ${ALT_JOIN[locale]} `);
}

function escapeTableCell(value) {
  return value.replace(/\|/g, '\\|');
}

function renderGroupTable(groupId, t, locale) {
  const entries = Object.values(SHORTCUTS_REGISTRY).filter((e) => e.group === groupId);
  if (entries.length === 0) return '';
  const header =
    `| ${t('docsKeyboardShortcutsTableHeaderShortcut')} ` +
    `| ${t('docsKeyboardShortcutsTableHeaderAction')} |\n` +
    `| --- | --- |\n`;
  const rows = entries
    .map((entry) => {
      // Commands assignable by the user but shipped without a default key
      // (empty bindings) are surfaced as "not set" rather than a blank cell.
      const combo =
        entry.defaultBindings.length === 0
          ? escapeTableCell(t('shortcutNotSet'))
          : escapeTableCell(formatBindings(entry.defaultBindings, locale));
      const action = escapeTableCell(t(entry.descriptionKey));
      return `| ${combo} | ${action} |`;
    })
    .join('\n');
  return header + rows + '\n';
}

function renderForLocale(locale) {
  const messages = loadMessages(locale);
  const t = makeT(messages);
  const tree = getDisplayTree('options');

  let md = '---\n';
  md += `title: ${t('docsKeyboardShortcutsTitle')}\n`;
  md += `description: ${t('docsKeyboardShortcutsIntro')}\n`;
  md += '---\n\n';
  md += `{/* ${t('docsKeyboardShortcutsGenerated')} */}\n\n`;
  md += `${t('docsKeyboardShortcutsIntro')}\n\n`;

  for (const { descriptor, subgroups } of tree) {
    md += `## ${t(descriptor.titleKey)}\n\n`;
    const table = renderGroupTable(descriptor.id, t, locale);
    if (table) md += table + '\n';

    for (const sub of subgroups) {
      const subTable = renderGroupTable(sub.id, t, locale);
      if (!subTable) continue;
      md += `### ${t(sub.titleKey)}\n\n`;
      md += subTable + '\n';
    }
  }

  return md;
}

function writeFile(absPath, contents) {
  mkdirSync(dirname(absPath), { recursive: true });
  writeFileSync(absPath, contents, 'utf-8');
}

function main() {
  // GROUP_DESCRIPTORS imported only for invariant validation.
  for (const groupId of Object.keys(GROUP_DESCRIPTORS)) {
    if (!GROUP_DESCRIPTORS[groupId].titleKey) {
      throw new Error(`Group descriptor ${groupId} is missing titleKey.`);
    }
  }

  for (const locale of LOCALES) {
    const md = renderForLocale(locale);
    const absPath = join(PROJECT_ROOT, OUTPUT_PATHS[locale]);
    writeFile(absPath, md);
    process.stdout.write(`Generated ${OUTPUT_PATHS[locale]}\n`);
  }
}

main();
