import {
  Shield,
  Copy,
  Archive,
  Layers,
  Package,
  FileText,
  BarChart3,
  Compass,
  HelpCircle,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { CATALOG } from '@/exploration/catalog.js';
import type { ExplorationDomain } from '@/exploration/domains.js';
import type { MissingPrerequisite } from '@/exploration/prerequisites.js';
import { getMessage, type MessageKey } from '@/utils/i18n.js';

/** Lucide icon for each exploration domain (UI-only mapping). */
export const DOMAIN_ICONS: Record<ExplorationDomain, LucideIcon> = {
  grouping: Shield,
  dedup: Copy,
  sessions: Archive,
  workspaces: Layers,
  packs: Package,
  importExport: FileText,
  stats: BarChart3,
  navigation: Compass,
  help: HelpCircle,
  settings: Settings,
};

/** The icon used for the exploration feature itself (sidebar + widget). */
export const EXPLORATION_ICON: LucideIcon = Compass;

const LABEL_KEY_BY_ID: ReadonlyMap<string, string> = new Map(CATALOG.map((c) => [c.id, c.labelKey]));

/** Localized short label for a capability id, falling back to the id. */
export function capabilityLabel(id: string): string {
  const key = LABEL_KEY_BY_ID.get(id);
  return key ? getMessage(key as MessageKey) : id;
}

/**
 * Renders a missing-prerequisite tree as clear text using the localized leaf
 * labels and the right connector (`and` for allOf, `or` for anyOf). Returns a
 * plain string so it can feed both visible text and an `aria-label`.
 */
export function formatMissingPrerequisite(missing: MissingPrerequisite): string {
  if (missing.kind === 'leaf') return capabilityLabel(missing.id);
  const connector = missing.kind === 'allOf'
    ? getMessage('explorationConnectorAnd')
    : getMessage('explorationConnectorOr');
  return missing.parts.map(formatMissingPrerequisite).join(` ${connector} `);
}
