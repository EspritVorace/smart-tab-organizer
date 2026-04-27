import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent } from 'storybook/test';
import { ConflictResolutionStep } from './ConflictResolutionStep';
import type { ConflictAnalysis, DuplicateTabAction, GroupConflictAction } from '@/utils/conflictDetection';
import type { SavedTab, SavedTabGroup } from '@/types/session';

const tab1: SavedTab = { id: 't1', title: 'React Docs', url: 'https://react.dev', favIconUrl: '' };
const tab2: SavedTab = { id: 't2', title: 'GitHub PR #42', url: 'https://github.com/pull/42', favIconUrl: '' };

const group1: SavedTabGroup = {
  id: 'grp-1',
  title: 'Frontend',
  color: 'blue',
  tabs: [tab1, tab2],
};

const group2: SavedTabGroup = {
  id: 'grp-2',
  title: 'Backend',
  color: 'green',
  tabs: [{ id: 't3', title: 'Node.js Docs', url: 'https://nodejs.org', favIconUrl: '' }],
};

const analysisWithDuplicatesOnly: ConflictAnalysis = {
  duplicateTabs: [
    { savedTab: tab1, existingTabUrl: 'https://react.dev' },
    { savedTab: tab2, existingTabUrl: 'https://github.com/pull/42' },
  ],
  newTabs: [],
  conflictingGroups: [],
  newGroups: [],
};

const analysisWithGroupsOnly: ConflictAnalysis = {
  duplicateTabs: [],
  newTabs: [],
  conflictingGroups: [
    { savedGroup: group1, existingGroupId: 101, existingGroupTitle: 'Frontend' },
    { savedGroup: group2, existingGroupId: 102, existingGroupTitle: 'Backend' },
  ],
  newGroups: [],
};

const analysisMixed: ConflictAnalysis = {
  duplicateTabs: [{ savedTab: tab1, existingTabUrl: 'https://react.dev' }],
  newTabs: [],
  conflictingGroups: [
    { savedGroup: group1, existingGroupId: 101, existingGroupTitle: 'Frontend' },
  ],
  newGroups: [],
};

const analysisEmpty: ConflictAnalysis = {
  duplicateTabs: [],
  newTabs: [tab1],
  conflictingGroups: [],
  newGroups: [group1],
};

function Wrapper({ analysis }: { analysis: ConflictAnalysis }) {
  const [duplicateTabAction, setDuplicateTabAction] = useState<DuplicateTabAction>('skip');
  const [groupActions, setGroupActions] = useState<Map<string, GroupConflictAction>>(new Map());

  return (
    <div style={{ width: 480, padding: 16 }}>
      <ConflictResolutionStep
        analysis={analysis}
        duplicateTabAction={duplicateTabAction}
        onDuplicateTabActionChange={setDuplicateTabAction}
        groupActions={groupActions}
        onGroupActionChange={(id, action) =>
          setGroupActions(prev => new Map(prev).set(id, action))
        }
      />
    </div>
  );
}

const meta: Meta = {
  title: 'Components/UI/SessionWizards/ConflictResolutionStep',
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ConflictResolutionDuplicatesOnly: Story = {
  render: () => <Wrapper analysis={analysisWithDuplicatesOnly} />,
};

export const ConflictResolutionGroupsOnly: Story = {
  render: () => <Wrapper analysis={analysisWithGroupsOnly} />,
};

export const ConflictResolutionMixed: Story = {
  render: () => <Wrapper analysis={analysisMixed} />,
};

export const ConflictResolutionEmpty: Story = {
  render: () => <Wrapper analysis={analysisEmpty} />,
};

// Switches duplicate tab action from "skip" to "open anyway".
export const ConflictResolutionSwitchOpenAnyway: Story = {
  render: () => <Wrapper analysis={analysisWithDuplicatesOnly} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const openAnywayRadio = canvas.getByRole('radio', { name: /open anyway/i });
    await userEvent.click(openAnywayRadio);
  },
};

// Changes a group conflict action via the Select dropdown.
export const ConflictResolutionChangeGroupAction: Story = {
  render: () => <Wrapper analysis={analysisWithGroupsOnly} />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    // Open the first group action Select
    const triggers = canvasElement.querySelectorAll('[role="combobox"]');
    if (triggers.length > 0) {
      await userEvent.click(triggers[0] as HTMLElement);
      const createNewOption = await body.findByText(/create new/i);
      await userEvent.click(createNewOption);
    }
  },
};
