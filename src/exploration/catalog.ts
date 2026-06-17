import type { ExplorationDomain } from './domains.js';
import type { Prerequisite } from './prerequisites.js';

/**
 * How a capability's discovery is detected. Informational only (it documents
 * the wiring strategy chosen for each entry); the runtime never branches on it.
 * - `touchpoint`: marked on an existing UI callback at display/selection.
 * - `derivation`: derived from an observed state mutation after init.
 * - `counter`: reuses an existing usage counter/flag.
 * - `ephemeral`: a genuine one-off event (only for actions with no other trace).
 */
export type DetectRule = 'touchpoint' | 'derivation' | 'counter' | 'ephemeral';

export interface CatalogEntry {
  /** Unique, stable, dot/kebab-case capability id. */
  id: string;
  domain: ExplorationDomain;
  /** i18n key for the short label (underscored, Chrome-i18n safe). */
  labelKey: string;
  /** i18n key for the one-sentence description. */
  descriptionKey: string;
  /** Where to go in the UI to use it (deep-link hash or human path). */
  uiTarget: string;
  /** Starlight doc path, when one exists. */
  docUrl?: string;
  detect: DetectRule;
  /** Reachability expression (US-A016). Absent = always reachable. */
  prerequisites?: Prerequisite;
}

/** Derives the i18n label key for an entry id (`a.b` -> `explorationEntry_a_b_label`). */
export function entryLabelKey(id: string): string {
  return `explorationEntry_${id.replace(/[^a-z0-9]+/gi, '_')}_label`;
}

/** Derives the i18n description key for an entry id. */
export function entryDescriptionKey(id: string): string {
  return `explorationEntry_${id.replace(/[^a-z0-9]+/gi, '_')}_desc`;
}

function e(
  id: string,
  domain: ExplorationDomain,
  uiTarget: string,
  detect: DetectRule,
  opts: { doc?: string; prerequisites?: Prerequisite } = {},
): CatalogEntry {
  return {
    id,
    domain,
    labelKey: entryLabelKey(id),
    descriptionKey: entryDescriptionKey(id),
    uiTarget,
    detect,
    ...(opts.doc ? { docUrl: opts.doc } : {}),
    ...(opts.prerequisites ? { prerequisites: opts.prerequisites } : {}),
  };
}

// Shared reachability expressions reused across entries.
const HAS_RULE: Prerequisite = { anyOf: ['grouping.create', 'packs.apply'] };
const DEDUP_ENABLED: Prerequisite = { anyOf: ['dedup.togglePerRule', 'settings.toggle.dedup'] };
const HAS_SESSION: Prerequisite = 'sessions.snapshot';
const HAS_WORKSPACE: Prerequisite = 'workspaces.create';

/**
 * The exploration catalogue: an exhaustive, hand-curated list of user-facing
 * capabilities, derived from the real sources (`src/schemas/enums.ts`,
 * `src/shortcuts/registry.ts`, `src/data/categories.json`, the rule forms). Each
 * entry counts 1 toward the flat global coverage. The list is validated at boot
 * by `validateCatalog`.
 */
export const CATALOG: readonly CatalogEntry[] = [
  // 1. Groupement et règles
  e('grouping.create', 'grouping', '#rules?action=new', 'touchpoint', { doc: 'guides/domain-rules#create' }),
  e('grouping.edit', 'grouping', '#rules', 'touchpoint', { doc: 'guides/domain-rules#edit', prerequisites: HAS_RULE }),
  e('grouping.mode.preset', 'grouping', '#rules', 'touchpoint', { doc: 'guides/domain-rules#configuration' }),
  e('grouping.mode.ask', 'grouping', '#rules', 'touchpoint', { doc: 'guides/domain-rules#configuration' }),
  e('grouping.mode.manual', 'grouping', '#rules', 'touchpoint', { doc: 'guides/domain-rules#configuration' }),
  e('grouping.mode.label', 'grouping', '#rules', 'touchpoint', { doc: 'guides/domain-rules#configuration' }),
  e('grouping.nameSource.title', 'grouping', '#rules', 'touchpoint', { doc: 'guides/group-tabs#naming-modes' }),
  e('grouping.nameSource.url', 'grouping', '#rules', 'touchpoint', { doc: 'guides/group-tabs#naming-modes' }),
  e('grouping.nameSource.smart', 'grouping', '#rules', 'touchpoint', { doc: 'guides/group-tabs#naming-modes' }),
  e('grouping.url.regex', 'grouping', '#rules', 'touchpoint', { doc: 'guides/domain-rules#configuration' }),
  e('grouping.url.queryParam', 'grouping', '#rules', 'touchpoint', { doc: 'guides/domain-rules#configuration' }),
  e('grouping.titleRegex', 'grouping', '#rules', 'touchpoint', { doc: 'guides/domain-rules#configuration' }),
  e('grouping.fallbackLabel', 'grouping', '#rules', 'touchpoint', { doc: 'guides/group-tabs#naming-modes' }),
  e('grouping.color', 'grouping', '#rules', 'touchpoint', { doc: 'guides/group-tabs#group-color' }),
  e('grouping.category', 'grouping', '#rules', 'touchpoint', { doc: 'reference/categories-and-packs#categories' }),
  e('grouping.presetApplied', 'grouping', '#rules', 'derivation', { doc: 'reference/regex-presets#presets' }),
  e('grouping.reorder.drag', 'grouping', '#rules', 'ephemeral', { doc: 'guides/domain-rules#list', prerequisites: HAS_RULE }),
  e('grouping.toggle', 'grouping', '#rules', 'touchpoint', { doc: 'guides/domain-rules#disable-delete', prerequisites: HAS_RULE }),
  e('grouping.overlaps', 'grouping', '#rules', 'ephemeral', { doc: 'guides/domain-rules#overlap', prerequisites: HAS_RULE }),
  e('grouping.merge', 'grouping', '#rules', 'derivation', { doc: 'guides/group-tabs#join-existing', prerequisites: HAS_RULE }),
  e('grouping.view.filterSort', 'grouping', '#rules', 'touchpoint', { doc: 'guides/domain-rules#filter-sort', prerequisites: HAS_RULE }),

  // 2. Déduplication
  e('dedup.togglePerRule', 'dedup', '#rules', 'touchpoint', { doc: 'guides/deduplicate#per-rule', prerequisites: HAS_RULE }),
  e('dedup.keep.old', 'dedup', '#settings', 'touchpoint', { doc: 'guides/deduplicate#keep-strategy', prerequisites: DEDUP_ENABLED }),
  e('dedup.keep.new', 'dedup', '#settings', 'touchpoint', { doc: 'guides/deduplicate#keep-strategy', prerequisites: DEDUP_ENABLED }),
  e('dedup.keep.grouped', 'dedup', '#settings', 'touchpoint', { doc: 'guides/deduplicate#keep-strategy', prerequisites: DEDUP_ENABLED }),
  e('dedup.keep.groupedOrNew', 'dedup', '#settings', 'touchpoint', { doc: 'guides/deduplicate#keep-strategy', prerequisites: DEDUP_ENABLED }),
  e('dedup.uncoveredScope', 'dedup', '#settings', 'touchpoint', { doc: 'guides/deduplicate#uncovered-scope', prerequisites: DEDUP_ENABLED }),
  e('dedup.organize', 'dedup', '#home', 'counter', { doc: 'guides/deduplicate#organize-all-tabs' }),
  e('dedup.undo', 'dedup', '#settings', 'ephemeral', { doc: 'guides/deduplicate#undo', prerequisites: DEDUP_ENABLED }),

  // 3. Sessions
  e('sessions.snapshot', 'sessions', '#sessions?action=snapshot', 'counter', { doc: 'guides/sessions#snapshot' }),
  e('sessions.restore.current', 'sessions', '#sessions', 'touchpoint', { doc: 'guides/sessions#restore', prerequisites: HAS_SESSION }),
  e('sessions.restore.new', 'sessions', '#sessions', 'touchpoint', { doc: 'guides/sessions#restore', prerequisites: HAS_SESSION }),
  e('sessions.restore.replace', 'sessions', '#sessions', 'touchpoint', { doc: 'guides/sessions#restore', prerequisites: HAS_SESSION }),
  e('sessions.restore.custom', 'sessions', '#sessions', 'touchpoint', { doc: 'guides/sessions#restore', prerequisites: HAS_SESSION }),
  e('sessions.defaultRestore', 'sessions', '#settings', 'touchpoint', { doc: 'guides/settings#default-restore' }),
  e('sessions.conflict', 'sessions', '#sessions', 'derivation', { doc: 'guides/sessions#conflict', prerequisites: HAS_SESSION }),
  e('sessions.pin', 'sessions', '#sessions', 'touchpoint', { doc: 'guides/sessions#pin', prerequisites: HAS_SESSION }),
  e('sessions.archive', 'sessions', '#sessions', 'touchpoint', { doc: 'guides/sessions#archive', prerequisites: HAS_SESSION }),
  e('sessions.subtab.archived', 'sessions', '#sessions', 'ephemeral', { doc: 'guides/sessions#archive', prerequisites: 'sessions.archive' }),
  e('sessions.unarchive', 'sessions', '#sessions', 'touchpoint', { doc: 'guides/sessions#archive', prerequisites: 'sessions.archive' }),
  e('sessions.note', 'sessions', '#sessions', 'touchpoint', { doc: 'guides/sessions#snapshot', prerequisites: HAS_SESSION }),
  e('sessions.hovercard', 'sessions', '#sessions', 'ephemeral', { doc: 'guides/sessions#card', prerequisites: HAS_SESSION }),
  e('sessions.rename', 'sessions', '#sessions', 'touchpoint', { doc: 'guides/sessions#edit', prerequisites: HAS_SESSION }),
  e('sessions.editor', 'sessions', '#sessions', 'ephemeral', { doc: 'guides/sessions#edit', prerequisites: HAS_SESSION }),
  e('sessions.refresh', 'sessions', '#sessions', 'touchpoint', { doc: 'guides/sessions#refresh', prerequisites: HAS_SESSION }),
  e('sessions.reorder', 'sessions', '#sessions', 'ephemeral', { doc: 'guides/sessions#edit', prerequisites: HAS_SESSION }),
  e('sessions.bulkSelect', 'sessions', '#sessions', 'touchpoint', { doc: 'guides/sessions#bulk', prerequisites: HAS_SESSION }),
  e('sessions.bulkActions', 'sessions', '#sessions', 'touchpoint', { doc: 'guides/sessions#bulk', prerequisites: HAS_SESSION }),
  e('sessions.collapse', 'sessions', '#sessions', 'ephemeral', { doc: 'guides/sessions#edit', prerequisites: HAS_SESSION }),
  e('sessions.search', 'sessions', '#sessions', 'ephemeral', { doc: 'guides/sessions#search', prerequisites: HAS_SESSION }),
  e('sessions.view.filterSort', 'sessions', '#sessions', 'touchpoint', { doc: 'guides/sessions#filter-sort', prerequisites: HAS_SESSION }),
  e('sessions.sectionNav', 'sessions', '#sessions', 'ephemeral', { doc: 'guides/sessions#buckets', prerequisites: HAS_SESSION }),

  // 4. Workspaces
  e('workspaces.create', 'workspaces', '#workspaces?action=new', 'touchpoint', { doc: 'guides/workspaces#create' }),
  e('workspaces.switch', 'workspaces', '#workspaces', 'touchpoint', { doc: 'guides/workspaces#switch', prerequisites: HAS_WORKSPACE }),
  e('workspaces.color', 'workspaces', '#workspaces', 'touchpoint', { doc: 'guides/workspaces#rename-color', prerequisites: HAS_WORKSPACE }),
  e('workspaces.avatar', 'workspaces', '#workspaces', 'touchpoint', { doc: 'guides/workspaces#rename-color', prerequisites: HAS_WORKSPACE }),
  e('workspaces.rename', 'workspaces', '#workspaces', 'touchpoint', { doc: 'guides/workspaces#rename-color', prerequisites: HAS_WORKSPACE }),
  e('workspaces.delete', 'workspaces', '#workspaces', 'touchpoint', { doc: 'guides/workspaces#delete', prerequisites: HAS_WORKSPACE }),
  e('workspaces.export', 'workspaces', '#importexport', 'touchpoint', { doc: 'guides/workspaces#export-import', prerequisites: HAS_WORKSPACE }),
  e('workspaces.import', 'workspaces', '#importexport', 'touchpoint', { doc: 'guides/workspaces#export-import' }),

  // 5. Packs
  e('packs.openGallery', 'packs', '#home', 'ephemeral', { doc: 'reference/categories-and-packs#pack-concept' }),
  e('packs.filterCategory', 'packs', '#home', 'ephemeral', { doc: 'reference/categories-and-packs#gallery', prerequisites: 'packs.openGallery' }),
  e('packs.search', 'packs', '#home', 'ephemeral', { doc: 'reference/categories-and-packs#gallery', prerequisites: 'packs.openGallery' }),
  e('packs.apply', 'packs', '#home', 'touchpoint', { doc: 'reference/categories-and-packs#import-pack', prerequisites: 'packs.openGallery' }),
  e('packs.categoriesExplored', 'packs', '#home', 'derivation', { doc: 'reference/categories-and-packs#categories', prerequisites: 'packs.openGallery' }),

  // 6. Import / Export
  e('io.exportRules', 'importExport', '#importexport', 'touchpoint', { doc: 'guides/import-export#export-rules' }),
  e('io.importRules', 'importExport', '#importexport', 'touchpoint', { doc: 'guides/import-export#import-rules' }),
  e('io.exportSessions', 'importExport', '#importexport', 'touchpoint', { doc: 'guides/import-export#export-sessions', prerequisites: HAS_SESSION }),
  e('io.importSessions', 'importExport', '#importexport', 'touchpoint', { doc: 'guides/import-export#import-sessions' }),
  e('io.sourceFile', 'importExport', '#importexport', 'touchpoint', { doc: 'guides/import-export#import-rules' }),
  e('io.sourceText', 'importExport', '#importexport', 'touchpoint', { doc: 'guides/import-export#import-rules' }),
  e('io.codemirror', 'importExport', '#importexport', 'ephemeral', { doc: 'guides/import-export#import-rules' }),
  e('io.note', 'importExport', '#importexport', 'touchpoint', { doc: 'guides/import-export#import-rules' }),
  e('io.conflict.new', 'importExport', '#importexport', 'touchpoint', { doc: 'guides/import-export#classification' }),
  e('io.conflict.overwrite', 'importExport', '#importexport', 'touchpoint', { doc: 'guides/import-export#classification' }),
  e('io.conflict.skip', 'importExport', '#importexport', 'touchpoint', { doc: 'guides/import-export#classification' }),
  e('io.classification', 'importExport', '#importexport', 'derivation', { doc: 'guides/import-export#classification' }),

  // 7. Statistiques et suivi
  e('stats.view', 'stats', '#stats', 'ephemeral', { doc: 'guides/statistics#summary' }),
  e('stats.trends', 'stats', '#stats', 'ephemeral', { doc: 'guides/statistics#this-week' }),
  e('stats.topRules', 'stats', '#stats', 'ephemeral', { doc: 'guides/statistics#top-rules' }),
  e('stats.sessions', 'stats', '#stats', 'ephemeral', { doc: 'guides/statistics#sessions' }),
  e('stats.storage', 'stats', '#stats', 'ephemeral', { doc: 'guides/statistics#storage' }),
  e('stats.reset', 'stats', '#stats', 'touchpoint', { doc: 'guides/statistics#reset' }),
  e('stats.tabNav', 'stats', '#stats', 'ephemeral', { doc: 'guides/statistics#summary' }),
  e('stats.exploration', 'stats', '#exploration', 'ephemeral', { doc: 'guides/exploration#coverage' }),

  // 8. Navigation et raccourcis
  e('nav.pinExtension', 'navigation', '#home', 'derivation', { doc: 'discover/installation#pin-toolbar' }),
  e('nav.sidebarSections', 'navigation', '#home', 'ephemeral', { doc: 'discover/interface-tour#sidebar' }),
  e('nav.sidebarCollapse', 'navigation', '#home', 'touchpoint', { doc: 'discover/interface-tour#sidebar' }),
  e('nav.globalSearch', 'navigation', '#home', 'ephemeral', { doc: 'reference/keyboard-shortcuts#options' }),
  e('nav.mnemonics', 'navigation', '#home', 'ephemeral', { doc: 'reference/keyboard-shortcuts#options' }),
  e('nav.sequences', 'navigation', '#importexport', 'ephemeral', { doc: 'reference/keyboard-shortcuts#importexport' }),
  e('nav.globalCommands', 'navigation', '#home', 'ephemeral', { doc: 'reference/keyboard-shortcuts#global' }),
  e('nav.workspaceSwitchKeyboard', 'navigation', '#workspaces', 'ephemeral', { doc: 'reference/keyboard-shortcuts#workspace', prerequisites: HAS_WORKSPACE }),

  // 9. Aide et documentation
  e('help.drawer', 'help', '#home', 'ephemeral', { doc: 'guides/help-and-documentation#shortcuts-panel' }),
  e('help.contextF1', 'help', '#home', 'ephemeral', { doc: 'guides/help-and-documentation#contextual-docs' }),
  e('help.readTip', 'help', '#home', 'ephemeral', { doc: 'guides/help-and-documentation#home-tips' }),
  e('help.onboardingHero', 'help', '#home', 'ephemeral', { doc: 'guides/help-and-documentation#onboarding' }),
  e('help.about', 'help', '#home', 'touchpoint', { doc: 'reference/about-dialog' }),
  e('help.changelog', 'help', '#home', 'touchpoint', { doc: 'reference/about-dialog#changelog' }),
  e('help.devTools', 'help', '#home', 'touchpoint', { doc: 'reference/about-dialog#built-with' }),

  // 10. Réglages et personnalisation
  e('settings.notif.grouping', 'settings', '#settings', 'touchpoint', { doc: 'guides/settings#notifications' }),
  e('settings.notif.dedup', 'settings', '#settings', 'touchpoint', { doc: 'guides/settings#notifications' }),
  e('settings.notif.organize', 'settings', '#settings', 'touchpoint', { doc: 'guides/settings#notifications' }),
  e('settings.toggle.grouping', 'settings', '#settings', 'touchpoint', { doc: 'guides/domain-rules#enable-grouping' }),
  e('settings.toggle.dedup', 'settings', '#settings', 'touchpoint', { doc: 'guides/deduplicate#enable-dedup' }),
  e('settings.theme', 'settings', '#home', 'touchpoint', { doc: 'discover/interface-tour#theme' }),
  e('settings.badge', 'settings', '#home', 'derivation', { doc: 'discover/interface-tour#badge' }),
  e('settings.quickActions', 'settings', '#home', 'ephemeral', { doc: 'discover/home-page#quick-actions' }),
  e('settings.restoreFromTile', 'settings', '#home', 'touchpoint', { doc: 'discover/home-page#profiles', prerequisites: 'sessions.pin' }),
];

/** Set of every catalogue id, for O(1) existence checks. */
export const CATALOG_IDS: ReadonlySet<string> = new Set(CATALOG.map((c) => c.id));
