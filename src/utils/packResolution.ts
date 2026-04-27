import type { ImportDomainRule } from '@/schemas/importExport';
import type { PackFile } from '@/schemas/pack';

export type PackParamSelection = Record<string, string>;

const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

/**
 * Resolve which import domain rules a given pack contributes.
 *
 * - Simple pack (no `configurable`) returns every rule verbatim.
 * - Configurable pack interpolates `{paramId}` placeholders inside
 *   `configurable.rulePattern` using the provided selection. If any
 *   placeholder is unresolved (missing param key in `selection`), the
 *   resolution yields no rules. Otherwise, the resolved pattern is used as
 *   a label prefix to filter `domainRules`.
 */
export function resolvePackRules(
  packFile: PackFile,
  selection: PackParamSelection = {},
): ImportDomainRule[] {
  const { pack, domainRules } = packFile;

  if (!pack.configurable) {
    return [...domainRules];
  }

  const params = pack.configurable.params;
  const knownIds = new Set(params.map((p) => p.id));

  let unresolved = false;
  const prefix = pack.configurable.rulePattern.replace(
    PLACEHOLDER_PATTERN,
    (_match, paramId: string) => {
      if (!knownIds.has(paramId)) {
        unresolved = true;
        return '';
      }
      const value = selection[paramId];
      if (typeof value !== 'string' || value.length === 0) {
        unresolved = true;
        return '';
      }
      return value;
    },
  );

  if (unresolved) {
    return [];
  }

  return domainRules.filter((rule) => rule.label.startsWith(prefix));
}
