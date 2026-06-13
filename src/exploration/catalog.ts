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
  e('grouping.create', 'grouping', '#rules?action=new', 'touchpoint', { doc: '/guides/rules/' }),
  e('grouping.edit', 'grouping', '#rules', 'touchpoint', { doc: '/guides/rules/', prerequisites: HAS_RULE }),
  e('grouping.mode.preset', 'grouping', '#rules', 'touchpoint', { doc: '/guides/rules/' }),
  e('grouping.mode.ask', 'grouping', '#rules', 'touchpoint', { doc: '/guides/rules/' }),
  e('grouping.mode.manual', 'grouping', '#rules', 'touchpoint', { doc: '/guides/rules/' }),
  e('grouping.mode.label', 'grouping', '#rules', 'touchpoint', { doc: '/guides/rules/' }),
  e('grouping.nameSource.title', 'grouping', '#rules', 'touchpoint'),
  e('grouping.nameSource.url', 'grouping', '#rules', 'touchpoint'),
  e('grouping.nameSource.smart', 'grouping', '#rules', 'touchpoint'),
  e('grouping.url.regex', 'grouping', '#rules', 'touchpoint', { doc: '/guides/rules/' }),
  e('grouping.url.queryParam', 'grouping', '#rules', 'touchpoint', { doc: '/guides/rules/' }),
  e('grouping.titleRegex', 'grouping', '#rules', 'touchpoint'),
  e('grouping.fallbackLabel', 'grouping', '#rules', 'touchpoint'),
  e('grouping.color', 'grouping', '#rules', 'touchpoint'),
  e('grouping.category', 'grouping', '#rules', 'touchpoint'),
  e('grouping.presetApplied', 'grouping', '#rules', 'derivation'),
  e('grouping.reorder.drag', 'grouping', '#rules', 'ephemeral', { prerequisites: HAS_RULE }),
  e('grouping.reorder.keyboard', 'grouping', '#rules', 'ephemeral', { prerequisites: HAS_RULE }),
  e('grouping.toggle', 'grouping', '#rules', 'touchpoint', { prerequisites: HAS_RULE }),
  e('grouping.overlaps', 'grouping', '#rules', 'ephemeral', { prerequisites: HAS_RULE }),
  e('grouping.merge', 'grouping', '#rules', 'derivation', { prerequisites: HAS_RULE }),
  e('grouping.view.filterSort', 'grouping', '#rules', 'touchpoint', { prerequisites: HAS_RULE }),

  // 2. Déduplication
  e('dedup.match.exact', 'dedup', '#rules', 'derivation', { doc: '/guides/deduplication/' }),
  e('dedup.match.includes', 'dedup', '#rules', 'derivation', { doc: '/guides/deduplication/' }),
  e('dedup.match.ignoreParams', 'dedup', '#rules', 'derivation', { doc: '/guides/deduplication/' }),
  e('dedup.togglePerRule', 'dedup', '#rules', 'touchpoint', { prerequisites: HAS_RULE }),
  e('dedup.keep.old', 'dedup', '#settings', 'touchpoint', { doc: '/guides/deduplication/', prerequisites: DEDUP_ENABLED }),
  e('dedup.keep.new', 'dedup', '#settings', 'touchpoint', { doc: '/guides/deduplication/', prerequisites: DEDUP_ENABLED }),
  e('dedup.keep.grouped', 'dedup', '#settings', 'touchpoint', { doc: '/guides/deduplication/', prerequisites: DEDUP_ENABLED }),
  e('dedup.keep.groupedOrNew', 'dedup', '#settings', 'touchpoint', { doc: '/guides/deduplication/', prerequisites: DEDUP_ENABLED }),
  e('dedup.uncoveredScope', 'dedup', '#settings', 'touchpoint', { prerequisites: DEDUP_ENABLED }),
  e('dedup.organize', 'dedup', '#home', 'counter', { doc: '/guides/deduplication/' }),
  e('dedup.undo', 'dedup', '#settings', 'ephemeral', { prerequisites: DEDUP_ENABLED }),

  // 3. Sessions
  e('sessions.snapshot', 'sessions', '#sessions?action=snapshot', 'counter', { doc: '/guides/sessions/' }),
  e('sessions.restore.current', 'sessions', '#sessions', 'touchpoint', { doc: '/guides/sessions/', prerequisites: HAS_SESSION }),
  e('sessions.restore.new', 'sessions', '#sessions', 'touchpoint', { doc: '/guides/sessions/', prerequisites: HAS_SESSION }),
  e('sessions.restore.replace', 'sessions', '#sessions', 'touchpoint', { doc: '/guides/sessions/', prerequisites: HAS_SESSION }),
  e('sessions.restore.custom', 'sessions', '#sessions', 'touchpoint', { doc: '/guides/sessions/', prerequisites: HAS_SESSION }),
  e('sessions.defaultRestore', 'sessions', '#settings', 'touchpoint'),
  e('sessions.conflict', 'sessions', '#sessions', 'derivation', { prerequisites: HAS_SESSION }),
  e('sessions.pin', 'sessions', '#sessions', 'touchpoint', { prerequisites: HAS_SESSION }),
  e('sessions.archive', 'sessions', '#sessions', 'touchpoint', { prerequisites: HAS_SESSION }),
  e('sessions.subtab.active', 'sessions', '#sessions', 'ephemeral', { prerequisites: HAS_SESSION }),
  e('sessions.subtab.archived', 'sessions', '#sessions', 'ephemeral', { prerequisites: 'sessions.archive' }),
  e('sessions.unarchive', 'sessions', '#sessions', 'touchpoint', { prerequisites: 'sessions.archive' }),
  e('sessions.note', 'sessions', '#sessions', 'touchpoint', { prerequisites: HAS_SESSION }),
  e('sessions.hovercard', 'sessions', '#sessions', 'ephemeral', { prerequisites: HAS_SESSION }),
  e('sessions.rename', 'sessions', '#sessions', 'touchpoint', { prerequisites: HAS_SESSION }),
  e('sessions.editor', 'sessions', '#sessions', 'ephemeral', { prerequisites: HAS_SESSION }),
  e('sessions.refresh', 'sessions', '#sessions', 'touchpoint', { prerequisites: HAS_SESSION }),
  e('sessions.reorder', 'sessions', '#sessions', 'ephemeral', { prerequisites: HAS_SESSION }),
  e('sessions.bulkSelect', 'sessions', '#sessions', 'touchpoint', { prerequisites: HAS_SESSION }),
  e('sessions.bulkActions', 'sessions', '#sessions', 'touchpoint', { prerequisites: HAS_SESSION }),
  e('sessions.collapse', 'sessions', '#sessions', 'ephemeral', { prerequisites: HAS_SESSION }),
  e('sessions.search', 'sessions', '#sessions', 'ephemeral', { prerequisites: HAS_SESSION }),
  e('sessions.view.filterSort', 'sessions', '#sessions', 'touchpoint', { prerequisites: HAS_SESSION }),

  // 4. Workspaces
  e('workspaces.create', 'workspaces', '#workspaces?action=new', 'touchpoint', { doc: '/guides/workspaces/' }),
  e('workspaces.switch', 'workspaces', '#workspaces', 'touchpoint', { doc: '/guides/workspaces/', prerequisites: HAS_WORKSPACE }),
  e('workspaces.color', 'workspaces', '#workspaces', 'touchpoint', { prerequisites: HAS_WORKSPACE }),
  e('workspaces.avatar', 'workspaces', '#workspaces', 'touchpoint', { prerequisites: HAS_WORKSPACE }),
  e('workspaces.rename', 'workspaces', '#workspaces', 'touchpoint', { prerequisites: HAS_WORKSPACE }),
  e('workspaces.delete', 'workspaces', '#workspaces', 'touchpoint', { prerequisites: HAS_WORKSPACE }),
  e('workspaces.export', 'workspaces', '#importexport', 'touchpoint', { prerequisites: HAS_WORKSPACE }),
  e('workspaces.import', 'workspaces', '#importexport', 'touchpoint'),

  // 5. Packs
  e('packs.openGallery', 'packs', '#home', 'ephemeral', { doc: '/guides/rule-packs/' }),
  e('packs.filterCategory', 'packs', '#home', 'ephemeral', { prerequisites: 'packs.openGallery' }),
  e('packs.search', 'packs', '#home', 'ephemeral', { prerequisites: 'packs.openGallery' }),
  e('packs.apply', 'packs', '#home', 'touchpoint', { doc: '/guides/rule-packs/', prerequisites: 'packs.openGallery' }),
  e('packs.categoriesExplored', 'packs', '#home', 'derivation', { prerequisites: 'packs.openGallery' }),

  // 6. Import / Export
  e('io.exportRules', 'importExport', '#importexport', 'touchpoint', { doc: '/guides/import-export/' }),
  e('io.importRules', 'importExport', '#importexport', 'touchpoint', { doc: '/guides/import-export/' }),
  e('io.exportSessions', 'importExport', '#importexport', 'touchpoint', { prerequisites: HAS_SESSION }),
  e('io.importSessions', 'importExport', '#importexport', 'touchpoint'),
  e('io.sourceFile', 'importExport', '#importexport', 'touchpoint'),
  e('io.sourceText', 'importExport', '#importexport', 'touchpoint'),
  e('io.codemirror', 'importExport', '#importexport', 'ephemeral'),
  e('io.note', 'importExport', '#importexport', 'touchpoint'),
  e('io.conflict.new', 'importExport', '#importexport', 'touchpoint'),
  e('io.conflict.overwrite', 'importExport', '#importexport', 'touchpoint'),
  e('io.conflict.skip', 'importExport', '#importexport', 'touchpoint'),
  e('io.classification', 'importExport', '#importexport', 'derivation'),
  e('io.deepLink', 'importExport', '#importexport', 'ephemeral'),

  // 7. Statistiques et suivi
  e('stats.view', 'stats', '#stats', 'ephemeral', { doc: '/guides/statistics/' }),
  e('stats.trends', 'stats', '#stats', 'ephemeral'),
  e('stats.topRules', 'stats', '#stats', 'ephemeral'),
  e('stats.sessions', 'stats', '#stats', 'ephemeral'),
  e('stats.storage', 'stats', '#stats', 'ephemeral'),
  e('stats.reset', 'stats', '#stats', 'touchpoint'),
  e('stats.exploration', 'stats', '#exploration', 'ephemeral', { doc: '/guides/exploration/' }),

  // 8. Navigation et raccourcis
  e('nav.sidebarSections', 'navigation', '#home', 'ephemeral'),
  e('nav.sidebarCollapse', 'navigation', '#home', 'touchpoint'),
  e('nav.globalSearch', 'navigation', '#home', 'ephemeral', { doc: '/reference/keyboard-shortcuts/' }),
  e('nav.mnemonics', 'navigation', '#home', 'ephemeral', { doc: '/reference/keyboard-shortcuts/' }),
  e('nav.sequences', 'navigation', '#importexport', 'ephemeral', { doc: '/reference/keyboard-shortcuts/' }),
  e('nav.globalCommands', 'navigation', '#home', 'ephemeral', { doc: '/reference/keyboard-shortcuts/' }),
  e('nav.workspaceSwitchKeyboard', 'navigation', '#workspaces', 'ephemeral', { doc: '/reference/keyboard-shortcuts/', prerequisites: HAS_WORKSPACE }),
  e('nav.listKeyboard', 'navigation', '#rules', 'ephemeral'),
  e('nav.reorderKeyboard', 'navigation', '#rules', 'ephemeral'),

  // 9. Aide et documentation
  e('help.drawer', 'help', '#home', 'ephemeral', { doc: '/guides/help/' }),
  e('help.contextF1', 'help', '#home', 'ephemeral', { doc: '/guides/help/' }),
  e('help.readTip', 'help', '#home', 'ephemeral'),
  e('help.tipVariants', 'help', '#home', 'touchpoint'),
  e('help.onboardingHero', 'help', '#home', 'ephemeral'),

  // 10. Réglages et personnalisation
  e('settings.notif.grouping', 'settings', '#settings', 'touchpoint'),
  e('settings.notif.dedup', 'settings', '#settings', 'touchpoint'),
  e('settings.notif.organize', 'settings', '#settings', 'touchpoint'),
  e('settings.toggle.grouping', 'settings', '#settings', 'touchpoint', { doc: '/guides/rules/' }),
  e('settings.toggle.dedup', 'settings', '#settings', 'touchpoint', { doc: '/guides/deduplication/' }),
  e('settings.theme', 'settings', '#home', 'touchpoint'),
  e('settings.badge', 'settings', '#home', 'derivation'),
  e('settings.quickActions', 'settings', '#home', 'ephemeral'),
  e('settings.restoreFromTile', 'settings', '#home', 'touchpoint', { prerequisites: 'sessions.pin' }),
];

/** Set of every catalogue id, for O(1) existence checks. */
export const CATALOG_IDS: ReadonlySet<string> = new Set(CATALOG.map((c) => c.id));
