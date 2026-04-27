import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PackCard } from './PackCard';
import type { PackFile } from '@/schemas/pack';
import type { ImportDomainRule } from '@/schemas/importExport';

const baseRule = (overrides: Partial<ImportDomainRule>): ImportDomainRule => ({
  id: overrides.id ?? 'r1',
  domainFilter: overrides.domainFilter ?? 'github.com',
  label: overrides.label ?? 'GitHub',
  titleParsingRegEx: '',
  urlParsingRegEx: '',
  groupNameSource: 'smart',
  deduplicationMatchMode: 'exact',
  deduplicationEnabled: true,
  ignoredQueryParams: [],
  presetId: null,
  enabled: true,
  color: overrides.color,
  ...overrides,
});

const simplePack: PackFile = {
  version: 1,
  pack: {
    id: 'pk-github',
    name: { en: 'GitHub', fr: 'GitHub' },
    description: { en: 'GitHub & GitLab grouping', fr: 'Regroupement GitHub & GitLab' },
    categoryId: 'dev',
  },
  domainRules: [
    baseRule({ id: 'rg', label: 'GitHub', domainFilter: 'github.com', color: 'blue' }),
    baseRule({ id: 'rl', label: 'GitLab', domainFilter: 'gitlab.com', color: 'orange' }),
  ],
};

const configurablePack: PackFile = {
  version: 1,
  pack: {
    id: 'pk-cloud',
    name: { en: 'Cloud Console', fr: 'Console Cloud' },
    description: { en: 'Group cloud provider consoles', fr: 'Groupe les consoles cloud' },
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
            { value: 'azure', label: 'Azure' },
          ],
        },
      ],
    },
  },
  domainRules: [
    baseRule({ id: 'a1', label: 'aws/EC2', domainFilter: 'console.aws.amazon.com', color: 'orange' }),
    baseRule({ id: 'a2', label: 'aws/S3', domainFilter: 's3.console.aws.amazon.com', color: 'orange' }),
    baseRule({ id: 'g1', label: 'gcp/Compute', domainFilter: 'console.cloud.google.com', color: 'blue' }),
  ],
};

function PackCardHarness({
  pack,
  initiallySelected = false,
}: {
  pack: PackFile;
  initiallySelected?: boolean;
}) {
  const [selected, setSelected] = useState(initiallySelected);
  return (
    <PackCard
      pack={pack}
      selected={selected}
      onSelectionChange={({ selected: next }) => setSelected(next)}
    />
  );
}

const meta = {
  title: 'Components/Core/Pack/PackGallery/PackCard',
  component: PackCardHarness,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PackCardHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PackCardSimple: Story = {
  args: {
    pack: simplePack,
  },
};

export const PackCardSimpleSelected: Story = {
  args: {
    pack: simplePack,
    initiallySelected: true,
  },
};

export const PackCardConfigurable: Story = {
  args: {
    pack: configurablePack,
  },
};

export const PackCardConfigurableNoMatch: Story = {
  args: {
    pack: {
      ...configurablePack,
      domainRules: [
        baseRule({ id: 'a1', label: 'aws/EC2', color: 'orange' }),
      ],
    },
    initiallySelected: true,
  },
};
