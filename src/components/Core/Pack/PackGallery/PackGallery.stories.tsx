import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PackGallery } from './PackGallery';
import type { PackCategory, PackFile } from '@/schemas/pack';
import type { ImportDomainRule } from '@/schemas/importExport';
import type { JsonSourceInputState } from '@/components/UI/ImportExportWizards/Source';
import type { DomainRuleSetting } from '@/types/syncSettings';

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
  enabled: true,
  ...overrides,
});

const categories: PackCategory[] = [
  { id: 'cloud', label: { en: 'Cloud', fr: 'Cloud' }, icon: '☁️' },
  { id: 'dev', label: { en: 'Development', fr: 'Développement' }, icon: '💻' },
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

function makeSourceStub(): JsonSourceInputState<DomainRuleSetting[]> {
  return {
    sourceMode: 'file',
    setSourceMode: () => undefined,
    jsonText: '',
    parsedData: null,
    parseError: null,
    importedNote: null,
    fileName: null,
    isDragOver: false,
    fileInputRef: { current: null } as never,
    handleTextChange: () => undefined,
    handleDrop: () => undefined,
    handleDragOver: () => undefined,
    handleDragLeave: () => undefined,
    handleBrowse: () => undefined,
    handleFileSelect: () => undefined,
    reset: () => undefined,
  };
}

interface HarnessProps {
  packs: PackFile[];
  categories: PackCategory[];
  initialSearch?: string;
}

function PackGalleryHarness({ packs, categories, initialSearch }: HarnessProps) {
  const source = useMemo(() => makeSourceStub(), []);
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
  return <PackGallery packs={packs} categories={categories} source={source} />;
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
