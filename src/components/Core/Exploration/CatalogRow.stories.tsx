import type { Meta, StoryObj } from '@storybook/react';
import { CatalogRow } from './CatalogRow';
import { CATALOG } from '@/exploration/catalog';
import { getEntryState } from '@/exploration/coverage';
import type { ExplorationProgress } from '@/types/exploration';

const createEntry = CATALOG.find((c) => c.id === 'grouping.create')!;
const editEntry = CATALOG.find((c) => c.id === 'grouping.edit')!; // requires a rule

function progress(p: Partial<ExplorationProgress> = {}): ExplorationProgress {
  return { discovered: [], manuallyMarked: [], values: {}, initializedAt: 1, ...p };
}

const meta = {
  title: 'Components/Core/Exploration/CatalogRow',
  component: CatalogRow,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof CatalogRow>;

export default meta;
type Story = StoryObj<typeof meta>;

function story(entry: typeof createEntry, prog: ExplorationProgress): Story {
  const { state, provenance } = getEntryState(entry, prog);
  return {
    args: {
      entry,
      state,
      provenance,
      progress: prog,
      onToggleMark: () => {},
      onGoToUi: () => {},
    },
  };
}

export const CatalogRowDiscoveredAuto: Story = story(createEntry, progress({ discovered: ['grouping.create'] }));
export const CatalogRowDiscoveredManual: Story = story(createEntry, progress({ manuallyMarked: ['grouping.create'] }));
export const CatalogRowToDiscover: Story = story(createEntry, progress());
export const CatalogRowNotPossible: Story = story(editEntry, progress());
