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

const makePreset = (id: string, name: string, domainFilters: string[] = []) => ({
  id,
  name,
  domainFilters,
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

describe('presetsToSearchableGroupsWithSuggestions', () => {
  const categories = (): PresetCategory[] => [
    {
      id: 'development',
      presets: [
        makePreset('gh-issue', 'GitHub Issue', ['github.com']),
        makePreset('jira', 'Jira Ticket', ['*']),
      ],
    },
  ];

  it('renders exactly like the base function when the domain is empty', async () => {
    const { presetsToSearchableGroups, presetsToSearchableGroupsWithSuggestions } =
      await import('../../src/utils/presetsToSearchableGroups');

    expect(presetsToSearchableGroupsWithSuggestions(categories(), '', 'Suggested')).toEqual(
      presetsToSearchableGroups(categories()),
    );
  });

  it('renders like the base function when no specific preset matches', async () => {
    const { presetsToSearchableGroups, presetsToSearchableGroupsWithSuggestions } =
      await import('../../src/utils/presetsToSearchableGroups');

    expect(
      presetsToSearchableGroupsWithSuggestions(categories(), 'example.com', 'Suggested'),
    ).toEqual(presetsToSearchableGroups(categories()));
  });

  it('prepends a leading group and dedupes the suggested preset from its category', async () => {
    const { presetsToSearchableGroupsWithSuggestions } =
      await import('../../src/utils/presetsToSearchableGroups');

    const result = presetsToSearchableGroupsWithSuggestions(
      categories(),
      'github.com',
      'Suggested for this domain',
    );

    expect(result[0]).toEqual({
      label: 'Suggested for this domain',
      options: [{ value: 'gh-issue', label: 'GitHub Issue' }],
    });
    // The development category keeps only the non-suggested (wildcard) preset.
    expect(result[1].options).toEqual([{ value: 'jira', label: 'Jira Ticket' }]);
  });

  it('drops a category group fully emptied by deduplication', async () => {
    const { presetsToSearchableGroupsWithSuggestions } =
      await import('../../src/utils/presetsToSearchableGroups');

    const cats: PresetCategory[] = [
      { id: 'development', presets: [makePreset('only', 'Only One', ['acme.com'])] },
    ];

    const result = presetsToSearchableGroupsWithSuggestions(cats, 'acme.com', 'Suggested');

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Suggested');
    expect(result[0].options).toEqual([{ value: 'only', label: 'Only One' }]);
  });
});
