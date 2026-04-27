import { describe, it, expect, vi } from 'vitest';

vi.mock('@/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => key),
}));
vi.mock('../../src/utils/i18n.js', () => ({
  getMessage: vi.fn((key: string) => key),
}));

import { resolvePackRules } from '../../src/utils/packResolution';
import type { PackFile } from '../../src/schemas/pack';
import type { ImportDomainRule } from '../../src/schemas/importExport';

const baseRule = (overrides: Partial<ImportDomainRule>): ImportDomainRule => ({
  id: overrides.id ?? 'r1',
  domainFilter: overrides.domainFilter ?? 'example.com',
  label: overrides.label ?? 'Label',
  titleParsingRegEx: '',
  urlParsingRegEx: '',
  groupNameSource: 'smart',
  deduplicationMatchMode: 'exact',
  deduplicationEnabled: true,
  ignoredQueryParams: [],
  presetId: null,
  enabled: true,
  ...overrides,
});

const simplePack: PackFile = {
  version: 1,
  pack: { id: 'pk-simple', name: 'Simple', categoryId: 'dev' },
  domainRules: [
    baseRule({ id: 'a', label: 'GitHub' }),
    baseRule({ id: 'b', label: 'GitLab' }),
  ],
};

const configurablePack: PackFile = {
  version: 1,
  pack: {
    id: 'pk-cfg',
    name: 'Cloud',
    categoryId: 'cloud',
    configurable: {
      rulePattern: '{provider}/',
      params: [
        {
          id: 'provider',
          label: 'Provider',
          default: 'aws',
          options: [
            { value: 'aws', label: 'AWS' },
            { value: 'gcp', label: 'GCP' },
          ],
        },
      ],
    },
  },
  domainRules: [
    baseRule({ id: 'r1', label: 'aws/EC2' }),
    baseRule({ id: 'r2', label: 'aws/S3' }),
    baseRule({ id: 'r3', label: 'aws/IAM (admin)' }),
    baseRule({ id: 'r4', label: 'gcp/Compute' }),
  ],
};

describe('resolvePackRules', () => {
  it('renvoie toutes les regles pour un pack simple', () => {
    const rules = resolvePackRules(simplePack);
    expect(rules).toHaveLength(2);
    expect(rules.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('renvoie une nouvelle reference (pas de mutation du pack)', () => {
    const rules = resolvePackRules(simplePack);
    expect(rules).not.toBe(simplePack.domainRules);
  });

  it('configurable + selection valide filtre par prefixe', () => {
    const rules = resolvePackRules(configurablePack, { provider: 'aws' });
    expect(rules.map((r) => r.id)).toEqual(['r1', 'r2', 'r3']);
  });

  it('configurable sans match retourne []', () => {
    const rules = resolvePackRules(configurablePack, { provider: 'azure' });
    expect(rules).toEqual([]);
  });

  it('configurable avec selection partielle (placeholder absent) retourne []', () => {
    const rules = resolvePackRules(configurablePack, {});
    expect(rules).toEqual([]);
  });

  it('plusieurs regles partagent le meme prefixe', () => {
    const rules = resolvePackRules(configurablePack, { provider: 'gcp' });
    expect(rules.map((r) => r.id)).toEqual(['r4']);
  });

  it('label avec qualificateur apres le prefixe est conserve', () => {
    const rules = resolvePackRules(configurablePack, { provider: 'aws' });
    const labels = rules.map((r) => r.label);
    expect(labels).toContain('aws/IAM (admin)');
  });

  it('selection contenant des cles extra est ignoree', () => {
    const rules = resolvePackRules(configurablePack, {
      provider: 'aws',
      foo: 'bar',
    });
    expect(rules.map((r) => r.id)).toEqual(['r1', 'r2', 'r3']);
  });
});
