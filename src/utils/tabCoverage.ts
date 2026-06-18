import { findMatchingRules } from '@/background/grouping';
import { splitDomainParts } from './domainParts';
import type { DomainRuleSetting } from '@/types/syncSettings';

/** A distinct host found across the open tabs, with its coverage facts. */
export interface TabCoverageEntry {
  /** Full host, e.g. `gist.github.com`. */
  host: string;
  /**
   * Registrable (public-suffix-aware) domain, e.g. `github.com` for
   * `gist.github.com` or `example.co.uk` for `a.b.example.co.uk`. Falls back to
   * the host itself when it is not a plain dotted domain (IPs, `localhost`).
   */
  registrableDomain: string;
  /** Number of open tabs whose host equals this entry's host. */
  tabCount: number;
  /** True when at least one enabled rule matches one of this host's tab URLs. */
  covered: boolean;
}

/** Minimal tab shape the coverage model needs (a subset of `Browser.tabs.Tab`). */
export interface CoverageTabInput {
  url?: string;
}

/**
 * Registrable domain of a host, derived by reusing `splitDomainParts` (the same
 * public-suffix-aware logic that colorizes the domain filter field): take the
 * `domain` part through the end of the string. Returns the host unchanged when
 * it is not a plain dotted domain.
 */
export function registrableDomainFromHost(host: string): string {
  const parts = splitDomainParts(host);
  const domainPart = parts.find((p) => p.kind === 'domain');
  if (!domainPart) return host;
  return host.slice(domainPart.from);
}

/**
 * Build the coverage model for the panel: one entry per distinct http(s) host
 * across the open tabs, with the registrable domain, the tab count and the
 * covered flag (an enabled rule matches at least one of the host's URLs).
 *
 * Non http(s) URLs (extension pages, `chrome://`, `about:`, `file://`, ...) are
 * excluded. Sort order: not covered first, then by tab count descending, then
 * host alphabetically as a stable tie-breaker.
 */
export function buildTabCoverageEntries(
  tabs: CoverageTabInput[],
  enabledRules: DomainRuleSetting[],
): TabCoverageEntry[] {
  // Accumulate per host: the tab count, one representative URL for matching,
  // and whether any of its URLs is covered by an enabled rule.
  const byHost = new Map<string, { count: number; covered: boolean }>();

  for (const tab of tabs) {
    const url = tab.url;
    if (!url) continue;
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      continue;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') continue;
    const host = parsed.hostname;
    if (!host) continue;

    const covered = findMatchingRules(url, enabledRules).length > 0;
    const existing = byHost.get(host);
    if (existing) {
      existing.count += 1;
      existing.covered = existing.covered || covered;
    } else {
      byHost.set(host, { count: 1, covered });
    }
  }

  const entries: TabCoverageEntry[] = Array.from(byHost.entries()).map(
    ([host, { count, covered }]) => ({
      host,
      registrableDomain: registrableDomainFromHost(host),
      tabCount: count,
      covered,
    }),
  );

  entries.sort((a, b) => {
    if (a.covered !== b.covered) return a.covered ? 1 : -1;
    if (a.tabCount !== b.tabCount) return b.tabCount - a.tabCount;
    return a.host.localeCompare(b.host);
  });

  return entries;
}
