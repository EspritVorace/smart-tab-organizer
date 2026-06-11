import type { Meta, StoryObj } from '@storybook/react';
import type { PackFile } from '@/schemas/pack';
import type { SuggestedPack } from '@/utils/packSuggestion';
import { HeroOnboardingSuggestions } from './HeroOnboardingSuggestions';

function makePack(id: string, name: string): PackFile {
  return {
    version: 1,
    pack: { id, name, categoryId: 'development' },
    domainRules: [
      {
        id: `${id}-rule`,
        domainFilter: `${id}.com`,
        label: name,
        titleParsingRegEx: '',
        urlParsingRegEx: '',
        groupNameSource: 'smart',
        deduplicationMatchMode: 'exact',
        deduplicationEnabled: true,
        ignoredQueryParams: [],
        presetId: null,
        enabled: true,
        urlExtractionMode: 'regex',
      },
    ],
  };
}

function suggestion(id: string, name: string, matchedTabs: number): SuggestedPack {
  return {
    pack: makePack(id, name),
    matchedTabs,
    matchedDomains: 1,
    installStatus: 'not-installed',
  };
}

const meta = {
  title: 'Components/HomePage/HeroOnboardingSuggestions',
  component: HeroOnboardingSuggestions,
  parameters: {
    layout: 'padded',
    landmark: false,
  },
  tags: ['autodocs'],
  args: {
    onImportAndOrganize: () => {},
  },
} satisfies Meta<typeof HeroOnboardingSuggestions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HeroOnboardingSuggestionsDefault: Story = {
  args: {
    suggestions: [
      suggestion('github', 'GitHub', 12),
      suggestion('jira', 'Jira', 5),
      suggestion('figma', 'Figma', 3),
    ],
  },
};

export const HeroOnboardingSuggestionsSingle: Story = {
  args: {
    suggestions: [suggestion('github', 'GitHub', 4)],
  },
};

export const HeroOnboardingSuggestionsEmpty: Story = {
  args: {
    suggestions: [],
  },
};
