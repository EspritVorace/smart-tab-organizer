import { describe, it, expect } from 'vitest';
import type { Preset, PresetCategory } from '../../src/types/preset';
import { getSuggestedPresetIds } from '../../src/utils/presetSuggestions';

const makePreset = (id: string, domainFilters: string[]): Preset =>
  ({
    id,
    name: id,
    domainFilters,
    groupNameSource: 'smart',
    description: '',
  }) as Preset;

const catalog: PresetCategory[] = [
  {
    id: 'generic',
    presets: [
      makePreset('numeric-id', ['*']),
      makePreset('jira-title', ['*']),
    ],
  },
  {
    id: 'development',
    presets: [
      makePreset('atlassian', ['*.atlassian.net']),
      makePreset('github', ['github.com']),
      makePreset('npm', ['*.npmjs.com']),
    ],
  },
];

describe('getSuggestedPresetIds', () => {
  it('suggests a preset whose specific filter matches the entered domain', () => {
    expect(getSuggestedPresetIds('myteam.atlassian.net', catalog)).toEqual(['atlassian']);
    expect(getSuggestedPresetIds('github.com', catalog)).toEqual(['github']);
  });

  it('never suggests wildcard-only presets', () => {
    // No specific filter matches "example.com", so nothing is suggested even
    // though the generic presets ("*") would match every domain at runtime.
    expect(getSuggestedPresetIds('example.com', catalog)).toEqual([]);
  });

  it('returns nothing for an empty or whitespace domain', () => {
    expect(getSuggestedPresetIds('', catalog)).toEqual([]);
    expect(getSuggestedPresetIds('   ', catalog)).toEqual([]);
    expect(getSuggestedPresetIds(null, catalog)).toEqual([]);
    expect(getSuggestedPresetIds(undefined, catalog)).toEqual([]);
  });

  it('matches a "*.example.com" filter against a subdomain and the bare apex', () => {
    const cat: PresetCategory[] = [
      { id: 'misc', presets: [makePreset('wild', ['*.example.com'])] },
    ];
    expect(getSuggestedPresetIds('team.example.com', cat)).toEqual(['wild']);
    expect(getSuggestedPresetIds('example.com', cat)).toEqual(['wild']);
    // Consistent with the runtime matcher: an unrelated domain does not match.
    expect(getSuggestedPresetIds('example.org', cat)).toEqual([]);
  });

  it('preserves catalog order across categories', () => {
    const cat: PresetCategory[] = [
      { id: 'a', presets: [makePreset('p1', ['acme.com']), makePreset('p2', ['*'])] },
      { id: 'b', presets: [makePreset('p3', ['*.acme.com'])] },
    ];
    expect(getSuggestedPresetIds('acme.com', cat)).toEqual(['p1', 'p3']);
  });
});
