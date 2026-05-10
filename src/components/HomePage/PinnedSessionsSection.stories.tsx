import type { Meta, StoryObj } from '@storybook/react';
import type { Session } from '@/types/session';
import { PinnedSessionsSection } from './PinnedSessionsSection';

function makeSession(id: string, name: string, groups: number, tabs: number): Session {
  return {
    id,
    name,
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: `2025-04-${String(((parseInt(id.replace(/\D/g, ''), 10) || 1) % 28) + 1).padStart(2, '0')}T10:00:00.000Z`,
    groups: Array.from({ length: groups }, (_, gi) => ({
      id: `${id}-g${gi}`,
      title: `Group ${gi + 1}`,
      color: 'blue',
      tabs: Array.from({ length: Math.ceil(tabs / Math.max(groups, 1)) }, (__, ti) => ({
        id: `${id}-g${gi}-t${ti}`,
        title: `Tab ${ti + 1}`,
        url: `https://example.com/${id}/${gi}/${ti}`,
      })),
    })),
    ungroupedTabs: groups === 0
      ? Array.from({ length: tabs }, (_, ti) => ({
          id: `${id}-u${ti}`,
          title: `Tab ${ti + 1}`,
          url: `https://example.com/${id}/${ti}`,
        }))
      : [],
    isPinned: true,
  };
}

const meta = {
  title: 'Components/HomePage/PinnedSessionsSection',
  component: PinnedSessionsSection,
  parameters: {
    layout: 'padded',
    landmark: false,
  },
  tags: ['autodocs'],
  args: {
    onSeeAll: () => {},
    onRestore: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1064 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PinnedSessionsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PinnedSessionsSectionThree: Story = {
  args: {
    sessions: [
      makeSession('s1', 'Work', 3, 12),
      makeSession('s2', 'AI research', 2, 7),
      makeSession('s3', 'Tech watch', 1, 4),
    ],
  },
};

export const PinnedSessionsSectionSingle: Story = {
  args: {
    sessions: [makeSession('s1', 'My onboarding', 0, 3)],
  },
};

/** More than 6 sessions: the section caps the rendered list at 6 and the counter stays accurate. */
export const PinnedSessionsSectionOverflow: Story = {
  args: {
    sessions: Array.from({ length: 9 }, (_, i) => makeSession(`s${i + 1}`, `Session ${i + 1}`, 2, 6)),
  },
};

/** No pinned sessions: the component returns null and renders nothing. */
export const PinnedSessionsSectionEmpty: Story = {
  args: {
    sessions: [],
  },
};
