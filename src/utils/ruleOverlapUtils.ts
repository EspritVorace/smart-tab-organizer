import { matchesDomain } from './utils';
import type { DomainRuleSetting } from '@/types/syncSettings';

const REGEX_CHARS = /[*+?^${}()|[\]\\]/;

function isPlainDomainFilter(domainFilter: string): boolean {
  const trimmed = domainFilter.trim();
  if (!trimmed) return false;
  return !REGEX_CHARS.test(trimmed);
}

function buildSampleUrl(domainFilter: string): string | null {
  const trimmed = domainFilter.trim();
  if (!trimmed || REGEX_CHARS.test(trimmed)) return null;
  const cleaned = trimmed.startsWith('*.') ? trimmed.slice(2) : trimmed;
  return `https://${cleaned}/`;
}

export function rulesOverlap(a: DomainRuleSetting, b: DomainRuleSetting): boolean {
  if (a.id === b.id) return false;
  const filterA = a.domainFilter?.trim() ?? '';
  const filterB = b.domainFilter?.trim() ?? '';
  if (!filterA || !filterB) return false;

  const plainA = isPlainDomainFilter(filterA);
  const plainB = isPlainDomainFilter(filterB);

  if (!plainA && !plainB) {
    return filterA === filterB;
  }

  const urlA = buildSampleUrl(filterA);
  const urlB = buildSampleUrl(filterB);

  if (urlA && matchesDomain(urlA, filterB)) return true;
  if (urlB && matchesDomain(urlB, filterA)) return true;
  return false;
}

export function findOverlappingRules(
  rule: DomainRuleSetting,
  allRules: DomainRuleSetting[],
): DomainRuleSetting[] {
  if (!rule.enabled) return [];
  return allRules.filter(
    (candidate) =>
      candidate.id !== rule.id &&
      candidate.enabled &&
      rulesOverlap(rule, candidate),
  );
}

/**
 * Returns all enabled rules that share an overlap with `rule`, including
 * `rule` itself, in the order of `allRules` (the runtime precedence order).
 * Returns an empty array when `rule` is disabled or has no overlapping
 * neighbour.
 */
export function getOverlapPrecedenceList(
  rule: DomainRuleSetting,
  allRules: DomainRuleSetting[],
): DomainRuleSetting[] {
  const others = findOverlappingRules(rule, allRules);
  if (others.length === 0) return [];
  const ids = new Set(others.map((r) => r.id));
  ids.add(rule.id);
  return allRules.filter((r) => ids.has(r.id));
}
