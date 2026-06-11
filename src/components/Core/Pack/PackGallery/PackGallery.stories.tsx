import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PackGallery } from './PackGallery';
import type { PackSelectionState } from './usePackSelections';
import type { PackFile } from '@/schemas/pack';
import type { RuleCategory } from '@/schemas/category';
import type { ImportDomainRule } from '@/schemas/importExport';

const baseRule = (overrides: Partial<ImportDomainRule>): ImportDomainRule => ({
  id: overrides.id ?? 'r',
  domainFilter: overrides.domainFilter ?? 'example.com',
  label: overrides.label ?? 'Label',
  titleParsingRegEx: '',
  urlParsingRegEx: '',
  groupNameSource: 'smart',
  deduplicationMatchMode: 'exact',
  deduplicationEnabled: true,
  ignoredQueryParams: [],
  presetId: null,
  urlExtractionMode: 'regex',
  enabled: true,
  ...overrides,
});

const categories: RuleCategory[] = [
  { id: 'cloud', emoji: '☁️', label: 'Cloud', builtIn: false },
  { id: 'dev', emoji: '💻', label: 'Development', builtIn: false },
];

const packs: PackFile[] = [
  {
    version: 1,
    pack: {
      id: 'pk-cloud',
      name: { en: 'Cloud Console', fr: 'Console Cloud' },
      description: {
        en: 'Group cloud provider consoles',
        fr: 'Groupe les consoles cloud',
      },
      categoryId: 'cloud',
      configurable: {
        rulePattern: '{provider}/',
        params: [
          {
            id: 'provider',
            label: { en: 'Provider', fr: 'Fournisseur' },
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
      baseRule({ id: 'a1', label: 'aws/EC2', color: 'orange' }),
      baseRule({ id: 'a2', label: 'aws/S3', color: 'orange' }),
      baseRule({ id: 'g1', label: 'gcp/Compute', color: 'blue' }),
    ],
  },
  {
    version: 1,
    pack: {
      id: 'pk-github',
      name: { en: 'Code Hosting', fr: 'Hébergement de code' },
      description: {
        en: 'GitHub & GitLab grouping',
        fr: 'Regroupement GitHub & GitLab',
      },
      categoryId: 'dev',
    },
    domainRules: [
      baseRule({ id: 'g', label: 'GitHub', domainFilter: 'github.com', color: 'blue' }),
      baseRule({ id: 'l', label: 'GitLab', domainFilter: 'gitlab.com', color: 'orange' }),
    ],
  },
];

interface HarnessProps {
  packs: PackFile[];
  categories: RuleCategory[];
  initialSearch?: string;
  existingRuleIds?: ReadonlySet<string>;
  matchedTabsByPackId?: ReadonlyMap<string, number>;
}

function PackGalleryHarness({
  packs,
  categories,
  initialSearch,
  existingRuleIds,
  matchedTabsByPackId,
}: HarnessProps) {
  const [selections, setSelections] = useState<Record<string, PackSelectionState>>({});
  const [, force] = useState(0);
  if (typeof initialSearch === 'string') {
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(
        '[data-testid="pack-gallery"] input',
      );
      if (input && input.value !== initialSearch) {
        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value',
        )?.set;
        setter?.call(input, initialSearch);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        force((n) => n + 1);
      }
    }, 0);
  }
  return (
    <PackGallery
      packs={packs}
      categories={categories}
      selections={selections}
      onSelectionChange={(id, next) => setSelections((prev) => ({ ...prev, [id]: next }))}
      existingRuleIds={existingRuleIds}
      matchedTabsByPackId={matchedTabsByPackId}
    />
  );
}

const meta = {
  title: 'Components/Core/Pack/PackGallery/PackGallery',
  component: PackGalleryHarness,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PackGalleryHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PackGalleryDefault: Story = {
  args: {
    packs,
    categories,
  },
};

export const PackGalleryEmpty: Story = {
  args: {
    packs: [],
    categories: [],
  },
};

export const PackGalleryWithSearch: Story = {
  args: {
    packs,
    categories,
    initialSearch: 'github',
  },
};

export const PackGalleryConfigurableExpanded: Story = {
  args: {
    packs: [packs[0]],
    categories: [categories[0]],
  },
};

export const PackGalleryWithMatchedTabs: Story = {
  args: {
    packs,
    categories,
    // pk-github matches 8 open tabs: it rises to the top and shows the indicator.
    matchedTabsByPackId: new Map([['pk-github', 8]]),
  },
};

export const PackGalleryWithInstalledPacks: Story = {
  args: {
    packs,
    categories,
    // pk-github (g, l) is fully installed; pk-cloud (a1, a2, g1) is partial (1/3).
    existingRuleIds: new Set(['g', 'l', 'a1']),
  },
};
