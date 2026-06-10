#!/usr/bin/env node
/**
 * Generates `docs/public/_redirects` for the EN-root documentation migration.
 *
 * Cloudflare serves these as real 301s (the docs Worker also enforces them
 * explicitly, see docs/worker/index.ts). Two rule families are emitted:
 *
 *   1. Locale migration (the slug table of issue #435):
 *      - FR: old FR-root URL -> /fr/<new slug> (language preserved).
 *      - EN: old /en/... URL  -> /<new slug> (English is now the root).
 *      - ES: old /es/<old>     -> /es/<new slug>.
 *   2. Legacy URLs (the former pre-restructuration FR-root paths), flattened
 *      so they point straight at the final /fr/... URLs (no redirect chain).
 *
 * IMPORTANT: FR and ES rules are emitted ONLY for slugs that actually change.
 * For an unchanged slug (e.g. `guides/popup`, `faq`), the old FR-root URL is
 * now the SAME URL as the new English root page; redirecting it to /fr/...
 * would make the English page unreachable. Such pages therefore get no rule
 * (old FR/ES visitors land on the now-English root page, which is acceptable).
 *
 * Each rule is emitted with and without a trailing slash to cover Starlight's
 * directory-style URLs. Idempotent: deterministic order, no timestamps.
 * Run via `pnpm docs:redirects`.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const OUTPUT_PATH = 'docs/public/_redirects';

// old per-locale slug -> new per-locale slug (no leading slash, no locale prefix).
const SLUG_MAP = [
  ['decouverte/pourquoi', 'discover/why'],
  ['decouverte/installation', 'discover/installation'],
  ['decouverte/tour-interface', 'discover/interface-tour'],
  ['decouverte/page-accueil', 'discover/home-page'],
  ['guides/popup', 'guides/popup'],
  ['guides/grouper-onglets', 'guides/group-tabs'],
  ['guides/regles-de-domaine', 'guides/domain-rules'],
  ['guides/dedupliquer', 'guides/deduplicate'],
  ['guides/sessions', 'guides/sessions'],
  ['guides/workspaces', 'guides/workspaces'],
  ['guides/import-export', 'guides/import-export'],
  ['guides/statistiques', 'guides/statistics'],
  ['guides/parametres', 'guides/settings'],
  ['guides/aide-et-documentation', 'guides/help-and-documentation'],
  ['reference/raccourcis-clavier', 'reference/keyboard-shortcuts'],
  ['reference/categories-et-packs', 'reference/categories-and-packs'],
  ['reference/presets-regex', 'reference/regex-presets'],
  ['reference/schema-json-import-export', 'reference/import-export-json-schema'],
  ['reference/licences-open-source', 'reference/open-source-licenses'],
  ['faq', 'faq'],
  ['contribuer/stack', 'contributing/stack'],
  ['contribuer/architecture', 'contributing/architecture'],
];

// Legacy (pre-restructuration) FR-root URLs -> final /fr/... URLs, flattened.
const LEGACY = [
  ['/introduction/pourquoi', '/fr/discover/why'],
  ['/demarrage/installation', '/fr/discover/installation'],
  ['/demarrage/tour-interface', '/fr/discover/interface-tour'],
  ['/demarrage/page-accueil', '/fr/discover/home-page'],
  ['/concepts/groupement', '/fr/guides/group-tabs'],
  ['/concepts/sources-nom-groupe', '/fr/guides/group-tabs'],
  ['/concepts/modes-nommage', '/fr/guides/group-tabs'],
  ['/concepts/deduplication', '/fr/guides/deduplicate'],
  ['/concepts/sessions-epinglees', '/fr/guides/sessions'],
  ['/concepts/packs', '/fr/reference/categories-and-packs'],
  ['/concepts/workspaces', '/fr/guides/workspaces'],
  ['/fonctionnalites/popup', '/fr/guides/popup'],
  ['/fonctionnalites/regles/vue-ensemble', '/fr/guides/domain-rules'],
  ['/fonctionnalites/regles/creer-une-regle', '/fr/guides/domain-rules'],
  ['/fonctionnalites/regles/modifier-supprimer', '/fr/guides/domain-rules'],
  ['/fonctionnalites/regles/packs', '/fr/reference/categories-and-packs'],
  ['/fonctionnalites/regles/presets-regex', '/fr/reference/regex-presets'],
  ['/fonctionnalites/sessions/vue-ensemble', '/fr/guides/sessions'],
  ['/fonctionnalites/sessions/capturer-instantane', '/fr/guides/sessions'],
  ['/fonctionnalites/sessions/restaurer-session', '/fr/guides/sessions'],
  ['/fonctionnalites/sessions/editer-session', '/fr/guides/sessions'],
  ['/fonctionnalites/sessions/sessions-epinglees', '/fr/guides/sessions'],
  ['/fonctionnalites/workspaces/vue-ensemble', '/fr/guides/workspaces'],
  ['/fonctionnalites/workspaces/gerer-workspaces', '/fr/guides/workspaces'],
  ['/fonctionnalites/workspaces/changer-workspace-actif', '/fr/guides/workspaces'],
  ['/fonctionnalites/workspaces/profils-popup', '/fr/guides/workspaces'],
  ['/fonctionnalites/import-export/exporter-regles', '/fr/guides/import-export'],
  ['/fonctionnalites/import-export/importer-regles', '/fr/guides/import-export'],
  ['/fonctionnalites/import-export/exporter-sessions', '/fr/guides/import-export'],
  ['/fonctionnalites/import-export/importer-sessions', '/fr/guides/import-export'],
  ['/fonctionnalites/import-export/exporter-workspace', '/fr/guides/import-export'],
  ['/fonctionnalites/import-export/importer-workspace', '/fr/guides/import-export'],
  ['/fonctionnalites/statistiques', '/fr/guides/statistics'],
  ['/fonctionnalites/parametres', '/fr/guides/settings'],
  ['/annexes/packs-integres', '/fr/reference/categories-and-packs'],
  ['/annexes/presets-regex', '/fr/reference/regex-presets'],
  ['/annexes/raccourcis-clavier', '/fr/reference/keyboard-shortcuts'],
  ['/annexes/stack-technique', '/fr/contributing/stack'],
];

/** Collect [source, destination] pairs for the locale-migration family. */
function migrationRules() {
  const rules = [];
  // EN: the old /en home and every /en/<old> URL collapse to the root.
  rules.push(['/en', '/']);
  for (const [oldSlug, newSlug] of SLUG_MAP) {
    rules.push([`/en/${oldSlug}`, `/${newSlug}`]);
  }
  // FR + ES: only changed slugs (unchanged ones would shadow the EN page).
  for (const [oldSlug, newSlug] of SLUG_MAP) {
    if (oldSlug === newSlug) continue;
    rules.push([`/${oldSlug}`, `/fr/${newSlug}`]);
    rules.push([`/es/${oldSlug}`, `/es/${newSlug}`]);
  }
  return rules;
}

/** Emit a rule both with and without a trailing slash on the source. */
function withSlashVariants(rules) {
  const lines = [];
  for (const [from, to] of rules) {
    const bare = from.replace(/\/$/, '') || '/';
    lines.push(`${bare} ${to} 301`);
    if (bare !== '/') lines.push(`${bare}/ ${to} 301`);
  }
  return lines;
}

function build() {
  const out = [
    '# Generated by scripts/generate-docs-redirects.mjs. Do not edit by hand.',
    '# Run `pnpm docs:redirects` to regenerate.',
    '',
    '# --- Locale migration: FR-root and /en|/es slugs -> EN-root scheme ---',
    ...withSlashVariants(migrationRules()),
    '',
    '# --- Legacy pre-restructuration URLs (flattened to final /fr/...) ---',
    ...withSlashVariants(LEGACY),
    '',
  ];
  return out.join('\n');
}

const absPath = join(PROJECT_ROOT, OUTPUT_PATH);
mkdirSync(dirname(absPath), { recursive: true });
writeFileSync(absPath, build(), 'utf8');
process.stdout.write(`Generated ${OUTPUT_PATH}\n`);
