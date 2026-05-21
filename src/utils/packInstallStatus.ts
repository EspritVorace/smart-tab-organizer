import type { PackFile } from '@/schemas/pack';

export type PackInstallStatus = 'not-installed' | 'partial' | 'installed';

export interface PackInstallInfo {
  status: PackInstallStatus;
  installedCount: number;
  totalCount: number;
}

/**
 * Compare the static rule IDs declared in a pack against the IDs of the
 * currently installed domain rules. Works the same for simple and
 * configurable packs because rule IDs are static in the pack JSON files;
 * the configurable resolution only filters by label prefix.
 */
export function computePackInstallStatus(
  pack: PackFile,
  existingRuleIds: ReadonlySet<string>,
): PackInstallInfo {
  const totalCount = pack.domainRules.length;
  if (totalCount === 0) {
    return { status: 'not-installed', installedCount: 0, totalCount: 0 };
  }

  let installedCount = 0;
  for (const rule of pack.domainRules) {
    if (existingRuleIds.has(rule.id)) installedCount += 1;
  }

  if (installedCount === 0) {
    return { status: 'not-installed', installedCount, totalCount };
  }
  if (installedCount === totalCount) {
    return { status: 'installed', installedCount, totalCount };
  }
  return { status: 'partial', installedCount, totalCount };
}
