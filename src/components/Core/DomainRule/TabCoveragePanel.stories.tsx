import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import { Button, Theme } from '@radix-ui/themes';
import { TabCoveragePanel } from './TabCoveragePanel';
import type { TabCoverageEntry } from '@/utils/tabCoverage';

const meta: Meta<typeof TabCoveragePanel> = {
  title: 'Components/Core/DomainRule/TabCoveragePanel',
  component: TabCoveragePanel,
  parameters: {
    layout: 'centered',
    // cmdk's Command.List hardcodes role="listbox" and Command.Empty
    // role="presentation", which axe flags as a missing required child for the
    // empty state. Same documented exception as the SearchableSelect stories.
    a11y: { config: { rules: [{ id: 'aria-required-children', enabled: false }] } },
  },
  decorators: [
    (Story) => (
      <Theme accentColor="indigo">
        <Story />
      </Theme>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const notCovered: TabCoverageEntry[] = [
  { host: 'news.ycombinator.com', registrableDomain: 'ycombinator.com', tabCount: 4, covered: false },
  { host: 'gist.github.com', registrableDomain: 'github.com', tabCount: 2, covered: false },
  { host: 'developer.mozilla.org', registrableDomain: 'mozilla.org', tabCount: 1, covered: false },
];

const alreadyManaged: TabCoverageEntry[] = [
  { host: 'mail.google.com', registrableDomain: 'google.com', tabCount: 3, covered: true },
  { host: 'calendar.google.com', registrableDomain: 'google.com', tabCount: 1, covered: true },
];

const mixed: TabCoverageEntry[] = [
  { host: 'news.ycombinator.com', registrableDomain: 'ycombinator.com', tabCount: 4, covered: false },
  { host: 'gist.github.com', registrableDomain: 'github.com', tabCount: 2, covered: false },
  { host: 'mail.google.com', registrableDomain: 'google.com', tabCount: 3, covered: true },
  { host: 'calendar.google.com', registrableDomain: 'google.com', tabCount: 1, covered: true },
];

function Harness({ entries }: { entries: TabCoverageEntry[] }) {
  const [open, setOpen] = useState(true);
  const [seeded, setSeeded] = useState<string | null>(null);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open panel</Button>
      {seeded && <p data-testid="seeded-value">{seeded}</p>}
      <TabCoveragePanel
        open={open}
        onOpenChange={setOpen}
        entries={entries}
        onSeed={setSeeded}
      />
    </>
  );
}

export const TabCoveragePanelNotCovered: Story = {
  render: () => <Harness entries={notCovered} />,
};

export const TabCoveragePanelAlreadyManaged: Story = {
  render: () => <Harness entries={alreadyManaged} />,
};

export const TabCoveragePanelMixed: Story = {
  render: () => <Harness entries={mixed} />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    // Selecting a host with a subdomain opens the level choice.
    const row = await body.findByLabelText(/gist\.github\.com/);
    await userEvent.click(row);
    await waitFor(() => expect(body.getByTestId('tab-coverage-level')).toBeInTheDocument());
    // The registrable domain is preselected, full host also offered.
    await expect(body.getByTestId('tab-coverage-level-registrable')).toHaveTextContent('github.com');
    await expect(body.getByTestId('tab-coverage-level-host')).toHaveTextContent('gist.github.com');
    // Confirm seeds the registrable domain.
    await userEvent.click(body.getByTestId('tab-coverage-seed'));
    await waitFor(() => expect(body.getByTestId('seeded-value')).toHaveTextContent('github.com'));
  },
};

export const TabCoveragePanelEmpty: Story = {
  render: () => <Harness entries={[]} />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getByText('No domain found in the open tabs')).toBeInTheDocument();
  },
};
