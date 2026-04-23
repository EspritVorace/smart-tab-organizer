import { describe, it, expect } from 'vitest';
import { presetsToSearchableGroups } from '../../src/utils/presetsToSearchableGroups';
import type { PresetCategory } from '../../src/types/preset';

const makePreset = (id: string, name: string) => ({
  id,
  name,
  domainFilters: [],
  titleRegex: '',
  urlRegex: '',
  groupNameSource: 'smart' as const,
  example: '',
  description: '',
});

describe('presetsToSearchableGroups', () => {
  it('returns an empty array for empty input', () => {
    expect(presetsToSearchableGroups([])).toEqual([]);
  });

  it('maps a single category with presets to a searchable group', () => {
    const categories: PresetCategory[] = [
      {
        id: 'cat-1',
        name: 'Dev Tools',
        description: '',
        presets: [makePreset('p1', 'GitHub Repository'), makePreset('p2', 'Jira Ticket')],
      },
    ];

    const result = presetsToSearchableGroups(categories);

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Dev Tools');
    expect(result[0].options).toHaveLength(2);
    expect(result[0].options[0]).toEqual({ value: 'p1', label: 'GitHub Repository' });
    expect(result[0].options[1]).toEqual({ value: 'p2', label: 'Jira Ticket' });
  });

  it('maps multiple categories correctly', () => {
    const categories: PresetCategory[] = [
      { id: 'cat-1', name: 'Dev', description: '', presets: [makePreset('p1', 'GitHub')] },
      { id: 'cat-2', name: 'Productivity', description: '', presets: [makePreset('p2', 'Notion')] },
    ];

    const result = presetsToSearchableGroups(categories);

    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('Dev');
    expect(result[1].label).toBe('Productivity');
  });

  it('handles a category with no presets', () => {
    const categories: PresetCategory[] = [
      { id: 'cat-1', name: 'Empty', description: '', presets: [] },
    ];

    const result = presetsToSearchableGroups(categories);

    expect(result).toHaveLength(1);
    expect(result[0].options).toHaveLength(0);
  });
});
