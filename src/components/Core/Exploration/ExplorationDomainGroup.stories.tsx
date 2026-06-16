import type { Meta, StoryObj } from '@storybook/react';
import { ExplorationDomainGroup } from './ExplorationDomainGroup';
import { CATALOG } from '@/exploration/catalog';
import type { ExplorationProgress } from '@/types/exploration';

const groupingEntries = CATALOG.filter((c) => c.domain === 'grouping').slice(0, 6);
const discoveredIds = groupingEntries.slice(0, 3).map((c) => c.id);
const progress: ExplorationProgress = {
  discovered: discoveredIds,
  manuallyMarked: [],
  values: {},
  initializedAt: 1,
};
const discovered = groupingEntries.filter((e) => discoveredIds.includes(e.id)).length;

const meta = {
  title: 'Components/Core/Exploration/ExplorationDomainGroup',
  component: ExplorationDomainGroup,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof ExplorationDomainGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseArgs = {
  domain: 'grouping' as const,
  entries: groupingEntries,
  progress,
  discovered,
  total: groupingEntries.length,
  percent: Math.round((discovered / groupingEntries.length) * 100),
  onToggle: () => {},
  onToggleMark: () => {},
  onGoToUi: () => {},
};

export const ExplorationDomainGroupOpen: Story = {
  args: { ...baseArgs, open: true, forceOpen: false },
};

export const ExplorationDomainGroupCollapsed: Story = {
  args: { ...baseArgs, open: false, forceOpen: false },
};

export const ExplorationDomainGroupForcedOpen: Story = {
  args: { ...baseArgs, open: false, forceOpen: true },
};

export const ExplorationDomainGroupComplete: Story = {
  args: {
    ...baseArgs,
    discovered: groupingEntries.length,
    total: groupingEntries.length,
    percent: 100,
    open: false,
    forceOpen: false,
  },
};
