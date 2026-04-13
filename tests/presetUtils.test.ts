import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadPresets,
  getAllPresets,
  getPresetById,
  getPresetsForDomain,
  clearPresetsCache,
} from '../src/utils/presetUtils';
import type { PresetsFile } from '../src/types/preset';

const SAMPLE_PRESETS: PresetsFile = {
  categories: [
    {
      id: 'dev',
      name: 'Development',
      description: 'Developer tools',
      presets: [
        {
          id: 'github-pr',
          name: 'GitHub Pull Request',
          domainFilters: ['github.com'],
          titleRegex: 'Pull Request #(\\d+)',
          groupNameSource: 'title',
          example: 'PR #123',
          description: 'Group GitHub PRs',
        },
        {
          id: 'gitlab-mr',
          name: 'GitLab Merge Request',
          domainFilters: ['gitlab.com', '*.gitlab.io'],
          titleRegex: 'Merge Request !(\\d+)',
          groupNameSource: 'title',
          example: 'MR !42',
          description: 'Group GitLab MRs',
        },
      ],
    },
    {
      id: 'generic',
      name: 'Generic',
      description: 'Works everywhere',
      presets: [
        {
          id: 'any',
          name: 'Any domain',
          domainFilters: ['*'],
          groupNameSource: 'smart',
          example: 'anything',
          description: 'Matches every domain',
        },
      ],
    },
  ],
};

function mockOkFetch(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  });
}

beforeEach(() => {
  clearPresetsCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadPresets', () => {
  it('fetches presets.json and returns the validated structure', async () => {
    vi.stubGlobal('fetch', mockOkFetch(SAMPLE_PRESETS));

    const presets = await loadPresets();

    expect(presets.categories).toHaveLength(2);
    expect(presets.categories[0].id).toBe('dev');
    expect(presets.categories[0].presets).toHaveLength(2);
  });

  it('caches the result across two consecutive calls', async () => {
    const fetchMock = mockOkFetch(SAMPLE_PRESETS);
    vi.stubGlobal('fetch', fetchMock);

    await loadPresets();
    await loadPresets();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reloads after clearPresetsCache() is called', async () => {
    const fetchMock = mockOkFetch(SAMPLE_PRESETS);
    vi.stubGlobal('fetch', fetchMock);

    await loadPresets();
    clearPresetsCache();
    await loadPresets();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns an empty categories list when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const presets = await loadPresets();

    expect(presets).toEqual({ categories: [] });
  });

  it('returns an empty categories list when the HTTP response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }),
    );

    const presets = await loadPresets();

    expect(presets).toEqual({ categories: [] });
  });

  it('returns an empty categories list when the JSON fails Zod validation', async () => {
    vi.stubGlobal('fetch', mockOkFetch({ notTheRightShape: true }));

    const presets = await loadPresets();

    expect(presets).toEqual({ categories: [] });
  });
});

describe('getAllPresets', () => {
  it('flattens presets from every category into a single list', async () => {
    vi.stubGlobal('fetch', mockOkFetch(SAMPLE_PRESETS));

    const all = await getAllPresets();

    expect(all).toHaveLength(3);
    expect(all.map(p => p.id)).toEqual(['github-pr', 'gitlab-mr', 'any']);
  });

  it('returns an empty array when no categories are loaded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')));

    expect(await getAllPresets()).toEqual([]);
  });
});

describe('getPresetById', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockOkFetch(SAMPLE_PRESETS));
  });

  it('returns the preset when the ID matches', async () => {
    const preset = await getPresetById('github-pr');
    expect(preset).not.toBeNull();
    expect(preset?.name).toBe('GitHub Pull Request');
  });

  it('returns null when no preset matches the ID', async () => {
    expect(await getPresetById('does-not-exist')).toBeNull();
  });

  it('finds presets across different categories', async () => {
    const preset = await getPresetById('any');
    expect(preset).not.toBeNull();
    expect(preset?.id).toBe('any');
  });
});

describe('getPresetsForDomain', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockOkFetch(SAMPLE_PRESETS));
  });

  it('matches presets with exact domain filters', async () => {
    const presets = await getPresetsForDomain('github.com');
    // github-pr matches github.com, any matches '*'
    expect(presets.map(p => p.id).sort()).toEqual(['any', 'github-pr']);
  });

  it('matches presets with wildcard "*" for any domain', async () => {
    const presets = await getPresetsForDomain('anything.example');
    expect(presets.some(p => p.id === 'any')).toBe(true);
  });

  it('matches substrings when filter uses *.domain.tld pattern', async () => {
    // Filter '*.gitlab.io' becomes '.gitlab.io', matched via domain.includes
    const presets = await getPresetsForDomain('pages.gitlab.io');
    expect(presets.map(p => p.id)).toContain('gitlab-mr');
  });

  it('does not match presets whose domain filter is not included in the given domain', async () => {
    const presets = await getPresetsForDomain('unrelated.test');
    // Only '*' preset matches
    expect(presets.map(p => p.id)).toEqual(['any']);
  });

  it('matches via substring when domain contains the filter text', async () => {
    // 'gitlab.com' filter is included in 'mycompany.gitlab.com' via domain.includes
    const presets = await getPresetsForDomain('mycompany.gitlab.com');
    expect(presets.map(p => p.id)).toContain('gitlab-mr');
  });
});
