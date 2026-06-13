import type { Meta, StoryObj } from '@storybook/react';
import { MiniExplorationSection } from './MiniExplorationSection';
import { computeCoverage } from '@/exploration/coverage';
import { CATALOG } from '@/exploration/catalog';
import type { ExplorationProgress } from '@/types/exploration';

function coverageFor(discoveredCount: number) {
  const discovered = CATALOG.slice(0, discoveredCount).map((c) => c.id);
  const progress: ExplorationProgress = { discovered, manuallyMarked: [], values: {}, initializedAt: 1 };
  return computeCoverage(progress);
}

const meta = {
  title: 'Components/HomePage/MiniExplorationSection',
  component: MiniExplorationSection,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof MiniExplorationSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MiniExplorationSectionEmpty: Story = {
  args: { coverage: coverageFor(0), onOpen: () => {} },
};

export const MiniExplorationSectionGettingStarted: Story = {
  args: { coverage: coverageFor(Math.round(CATALOG.length * 0.35)), onOpen: () => {} },
};

export const MiniExplorationSectionExpertise: Story = {
  args: { coverage: coverageFor(Math.round(CATALOG.length * 0.9)), onOpen: () => {} },
};
