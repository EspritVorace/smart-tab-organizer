import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PresetCategory } from '../../src/types/preset';
import type { RuleCategory } from '../../src/schemas/category';
import {
  _resetCategoriesStoreForTests,
  _setCategoriesForTests,
} from '../../src/utils/categoriesStore';

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => `i18n(${key})`),
}));

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

const SAMPLE_RULE_CATS: RuleCategory[] = [
  { id: 'development', emoji: '💻', labelKey: 'category_development', builtIn: true },
  { id: 'productivity', emoji: '📋', labelKey: 'category_productivity', builtIn: true },
];

beforeEach(() => {
  _resetCategoriesStoreForTests();
  _setCategoriesForTests(SAMPLE_RULE_CATS);
});

describe('presetsToSearchableGroups', () => {
  it('returns an empty array for empty input', async () => {
    const { presetsToSearchableGroups } = await import('../../src/utils/presetsToSearchableGroups');
    expect(presetsToSearchableGroups([])).toEqual([]);
  });

  it('resolves the group label as "<emoji> <i18n label>" for a known category', async () => {
    const { presetsToSearchableGroups } = await import('../../src/utils/presetsToSearchableGroups');
    const categories: PresetCategory[] = [
      {
        id: 'development',
        presets: [makePreset('p1', 'GitHub Repository'), makePreset('p2', 'Jira Ticket')],
      },
    ];

    const result = presetsToSearchableGroups(categories);

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('💻 i18n(category_development)');
    expect(result[0].options).toHaveLength(2);
    expect(result[0].options[0]).toEqual({ value: 'p1', label: 'GitHub Repository' });
  });

  it('maps multiple categories correctly', async () => {
    const { presetsToSearchableGroups } = await import('../../src/utils/presetsToSearchableGroups');
    const categories: PresetCategory[] = [
      { id: 'development', presets: [makePreset('p1', 'GitHub')] },
      { id: 'productivity', presets: [makePreset('p2', 'Notion')] },
    ];

    const result = presetsToSearchableGroups(categories);

    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('💻 i18n(category_development)');
    expect(result[1].label).toBe('📋 i18n(category_productivity)');
  });

  it('falls back to the raw category id when the category is unknown', async () => {
    const { presetsToSearchableGroups } = await import('../../src/utils/presetsToSearchableGroups');
    const categories: PresetCategory[] = [
      { id: 'unknown-id', presets: [makePreset('p1', 'P1')] },
    ];

    const result = presetsToSearchableGroups(categories);

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('unknown-id');
  });

  it('handles a category with no presets', async () => {
    const { presetsToSearchableGroups } = await import('../../src/utils/presetsToSearchableGroups');
    const categories: PresetCategory[] = [
      { id: 'development', presets: [] },
    ];

    const result = presetsToSearchableGroups(categories);

    expect(result).toHaveLength(1);
    expect(result[0].options).toHaveLength(0);
  });
});
