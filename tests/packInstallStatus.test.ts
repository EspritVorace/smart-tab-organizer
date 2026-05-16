import { describe, it, expect } from 'vitest';
import { computePackInstallStatus } from '../src/utils/packInstallStatus';
import type { PackFile } from '../src/schemas/pack';
import type { ImportDomainRule } from '../src/schemas/importExport';

function makeRule(id: string): ImportDomainRule {
  return {
    id,
    enabled: true,
    domainFilter: `${id}.example.com`,
    label: id,
    titleParsingRegEx: '',
    urlParsingRegEx: '',
    groupNameSource: 'smart',
    deduplicationMatchMode: 'exact',
    deduplicationEnabled: true,
    ignoredQueryParams: [],
    presetId: null,
    urlExtractionMode: 'regex',
  };
}

function makePack(id: string, ruleIds: string[]): PackFile {
  return {
    version: 1,
    pack: {
      id,
      name: { en: id },
      categoryId: 'cat',
    },
    domainRules: ruleIds.map(makeRule),
  };
}

describe('computePackInstallStatus', () => {
  it('returns not-installed when the pack has no rules', () => {
    const pack = makePack('pk-empty', []);
    expect(computePackInstallStatus(pack, new Set(['anything']))).toEqual({
      status: 'not-installed',
      installedCount: 0,
      totalCount: 0,
    });
  });

  it('returns not-installed when no rule ID matches existing rules', () => {
    const pack = makePack('pk-a', ['r1', 'r2']);
    expect(computePackInstallStatus(pack, new Set(['rx', 'ry']))).toEqual({
      status: 'not-installed',
      installedCount: 0,
      totalCount: 2,
    });
  });

  it('returns partial when some but not all rules are present', () => {
    const pack = makePack('pk-a', ['r1', 'r2', 'r3']);
    expect(computePackInstallStatus(pack, new Set(['r1', 'r3']))).toEqual({
      status: 'partial',
      installedCount: 2,
      totalCount: 3,
    });
  });

  it('returns installed when every rule ID is present in existing rules', () => {
    const pack = makePack('pk-a', ['r1', 'r2']);
    expect(
      computePackInstallStatus(pack, new Set(['r1', 'r2', 'extra'])),
    ).toEqual({
      status: 'installed',
      installedCount: 2,
      totalCount: 2,
    });
  });

  it('treats configurable packs the same way (rule IDs are static)', () => {
    const pack: PackFile = {
      version: 1,
      pack: {
        id: 'pk-cloud',
        name: { en: 'Cloud' },
        categoryId: 'cloud',
        configurable: {
          rulePattern: '{provider}/',
          params: [
            {
              id: 'provider',
              label: { en: 'Provider' },
              default: 'aws',
              options: [
                { value: 'aws', label: { en: 'AWS' } },
                { value: 'gcp', label: { en: 'GCP' } },
              ],
            },
          ],
        },
      },
      domainRules: [makeRule('a1'), makeRule('a2'), makeRule('g1')],
    };
    expect(computePackInstallStatus(pack, new Set(['a1', 'a2', 'g1']))).toEqual({
      status: 'installed',
      installedCount: 3,
      totalCount: 3,
    });
    expect(computePackInstallStatus(pack, new Set(['a1']))).toEqual({
      status: 'partial',
      installedCount: 1,
      totalCount: 3,
    });
  });
});
