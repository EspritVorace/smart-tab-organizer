import { arrayMove } from '@dnd-kit/helpers';
import type { DomainRuleSetting } from '../types/syncSettings.js';

/**
 * Returns the "root domain" of a domainFilter for grouping purposes.
 * - "sub.example.com" → "example.com" (last 2 segments)
 * - "example.com" → "example.com"
 * - "localhost" → "localhost"
 * - regex patterns (contain regex metacharacters other than . and -) → "__regex__"
 */
export function getRootDomain(domainFilter: string): string {
  if (!domainFilter) return '__empty__';
  const trimmed = domainFilter.trim();
  // Regex pattern: contains chars that are not valid in a plain domain
  const hasRegexChars = /[*+?^${}()|[\]\\]/.test(trimmed);
  if (hasRegexChars) return '__regex__';
  if (trimmed === 'localhost') return 'localhost';
  const parts = trimmed.split('.');
  if (parts.length <= 2) return trimmed;
  return parts.slice(-2).join('.');
}

/**
 * Returns all rules sharing the same root domain as the given domainFilter.
 */
export function getRulesForRootDomain(
  rules: DomainRuleSetting[],
  domainFilter: string,
): DomainRuleSetting[] {
  const root = getRootDomain(domainFilter);
  return rules.filter(r => getRootDomain(r.domainFilter) === root);
}

/**
 * Moves the given rule to position 0 in the array.
 */
export function moveToFirst(
  rules: DomainRuleSetting[],
  ruleId: string,
): DomainRuleSetting[] {
  const idx = rules.findIndex(r => r.id === ruleId);
  if (idx <= 0) return rules;
  return arrayMove(rules, idx, 0);
}

/**
 * Moves the given rule to the last position in the array.
 */
export function moveToLast(
  rules: DomainRuleSetting[],
  ruleId: string,
): DomainRuleSetting[] {
  const idx = rules.findIndex(r => r.id === ruleId);
  if (idx < 0 || idx === rules.length - 1) return rules;
  return arrayMove(rules, idx, rules.length - 1);
}

/**
 * Moves the given rule to just before all other rules sharing the same root domain.
 * Rules of other domains are not affected.
 */
export function moveToFirstOfDomain(
  rules: DomainRuleSetting[],
  ruleId: string,
): DomainRuleSetting[] {
  const ruleIdx = rules.findIndex(r => r.id === ruleId);
  if (ruleIdx < 0) return rules;
  const rule = rules[ruleIdx];
  const root = getRootDomain(rule.domainFilter);

  // Find index of the first rule in the array that shares the same root domain
  const firstOfDomainIdx = rules.findIndex(r => getRootDomain(r.domainFilter) === root);
  if (firstOfDomainIdx === ruleIdx) return rules; // already first
  return arrayMove(rules, ruleIdx, firstOfDomainIdx);
}

/**
 * Moves the given rule to just after all other rules sharing the same root domain.
 * Rules of other domains are not affected.
 */
export function moveToLastOfDomain(
  rules: DomainRuleSetting[],
  ruleId: string,
): DomainRuleSetting[] {
  const ruleIdx = rules.findIndex(r => r.id === ruleId);
  if (ruleIdx < 0) return rules;
  const rule = rules[ruleIdx];
  const root = getRootDomain(rule.domainFilter);

  // Find index of the last rule in the array that shares the same root domain
  let lastOfDomainIdx = -1;
  for (let i = 0; i < rules.length; i++) {
    if (getRootDomain(rules[i].domainFilter) === root) {
      lastOfDomainIdx = i;
    }
  }
  if (lastOfDomainIdx === ruleIdx) return rules; // already last
  return arrayMove(rules, ruleIdx, lastOfDomainIdx);
}

/**
 * Applies a drag-and-drop reorder: moves activeId to the position of overId
 * within the filteredIds subset, then reconstructs the full allRules array.
 *
 * When DnD is only enabled with no active search filter,
 * filteredIds === allRules.map(r => r.id), making this a simple arrayMove.
 */
export function applyDragReorder(
  allRules: DomainRuleSetting[],
  filteredIds: string[],
  activeId: string,
  overId: string,
): DomainRuleSetting[] {
  const activeIndex = filteredIds.indexOf(activeId);
  const overIndex = filteredIds.indexOf(overId);
  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) return allRules;

  const reorderedFilteredIds = arrayMove(filteredIds, activeIndex, overIndex);

  // Rebuild full array: place filtered items in their new order,
  // preserving non-filtered items at their original positions.
  const filteredSet = new Set(filteredIds);
  const result: DomainRuleSetting[] = [];
  let filteredPointer = 0;
  const ruleById = new Map(allRules.map(r => [r.id, r]));

  for (const rule of allRules) {
    if (filteredSet.has(rule.id)) {
      result.push(ruleById.get(reorderedFilteredIds[filteredPointer])!);
      filteredPointer++;
    } else {
      result.push(rule);
    }
  }

  return result;
}
