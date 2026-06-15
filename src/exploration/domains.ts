/**
 * The ten exploration domains. Each domain renders as one progress bar on the
 * "Référentiel d'exploration" page. Domains are a fixed, ordered list; the
 * `labelKey` resolves to the localized domain name and the `icon` is a Lucide
 * component resolved in the UI layer (kept out of this data module so the
 * catalogue stays free of React imports).
 */
export const EXPLORATION_DOMAINS = [
  'grouping',
  'dedup',
  'sessions',
  'workspaces',
  'packs',
  'importExport',
  'stats',
  'navigation',
  'help',
  'settings',
] as const;

export type ExplorationDomain = (typeof EXPLORATION_DOMAINS)[number];

/** i18n key for a domain label, e.g. `explorationDomainGrouping`. */
export function domainLabelKey(domain: ExplorationDomain): string {
  return `explorationDomain${domain.charAt(0).toUpperCase()}${domain.slice(1)}`;
}

export function isExplorationDomain(value: string): value is ExplorationDomain {
  return (EXPLORATION_DOMAINS as readonly string[]).includes(value);
}
