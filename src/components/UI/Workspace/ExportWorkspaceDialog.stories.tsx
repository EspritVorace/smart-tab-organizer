import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ActiveWorkspaceContext, type ActiveWorkspaceContextValue } from '@/contexts/ActiveWorkspaceContext';
import { defineWorkspaceItems, DEFAULT_WORKSPACE_ID } from '@/utils/workspaceStorage';
import type { WorkspaceMeta } from '@/schemas/workspace';
import { ExportWorkspaceDialog } from './ExportWorkspaceDialog';

const sampleWorkspace: WorkspaceMeta = {
  id: DEFAULT_WORKSPACE_ID,
  name: 'Personal',
  accentColor: 'indigo',
  createdAt: '2026-01-01T09:00:00.000Z',
  updatedAt: '2026-04-30T11:30:00.000Z',
};

const sampleContextValue: ActiveWorkspaceContextValue = {
  workspaces: [sampleWorkspace],
  activeId: sampleWorkspace.id,
  active: sampleWorkspace,
  accentColor: sampleWorkspace.accentColor,
  scopedItems: defineWorkspaceItems(sampleWorkspace.id),
  isLoaded: true,
  switchTo: async () => undefined,
  createWorkspace: async () => sampleWorkspace,
  renameWorkspace: async () => undefined,
  setWorkspaceColor: async () => undefined,
  removeWorkspace: async () => undefined,
};

async function seedWorkspaceData() {
  const items = defineWorkspaceItems(sampleWorkspace.id);
  await items.domainRulesItem.setValue([
    {
      id: 'r1',
      domainFilter: 'github.com',
      label: 'GitHub',
      titleParsingRegEx: '',
      urlParsingRegEx: '',
      groupNameSource: 'smart',
      deduplicationMatchMode: 'exact',
      deduplicationEnabled: true,
      ignoredQueryParams: [],
      presetId: null,
      urlExtractionMode: 'regex',
      enabled: true,
    },
    {
      id: 'r2',
      domainFilter: 'figma.com',
      label: 'Figma',
      titleParsingRegEx: '',
      urlParsingRegEx: '',
      groupNameSource: 'smart',
      deduplicationMatchMode: 'exact',
      deduplicationEnabled: true,
      ignoredQueryParams: [],
      presetId: null,
      urlExtractionMode: 'regex',
      enabled: true,
    },
    {
      id: 'r3',
      domainFilter: 'notion.so',
      label: 'Notion',
      titleParsingRegEx: '',
      urlParsingRegEx: '',
      groupNameSource: 'smart',
      deduplicationMatchMode: 'exact',
      deduplicationEnabled: true,
      ignoredQueryParams: [],
      presetId: null,
      urlExtractionMode: 'regex',
      enabled: true,
    },
    {
      id: 'r4',
      domainFilter: 'linear.app',
      label: 'Linear',
      titleParsingRegEx: '',
      urlParsingRegEx: '',
      groupNameSource: 'smart',
      deduplicationMatchMode: 'exact',
      deduplicationEnabled: true,
      ignoredQueryParams: [],
      presetId: null,
      urlExtractionMode: 'regex',
      enabled: true,
    },
  ]);
  await items.sessionsItem.setValue([
    {
      id: 'session-pinned-1',
      name: 'Snapshot 30 avr. 2026, 11:30',
      createdAt: '2026-04-30T11:30:00.000Z',
      updatedAt: '2026-04-30T11:30:00.000Z',
      isPinned: true,
      groups: [
        {
          id: 'grp-1',
          title: 'Dev',
          color: 'blue',
          tabs: [
            { id: 't1', title: 'GitHub', url: 'https://github.com' },
            { id: 't2', title: 'Linear', url: 'https://linear.app' },
          ],
        },
      ],
      ungroupedTabs: [],
    },
    {
      id: 'session-2',
      name: 'session de test',
      createdAt: '2026-04-30T11:00:00.000Z',
      updatedAt: '2026-04-30T11:00:00.000Z',
      isPinned: false,
      groups: [
        {
          id: 'grp-2',
          title: 'Reading',
          color: 'green',
          tabs: [
            { id: 't3', title: 'Notion', url: 'https://notion.so' },
            { id: 't4', title: 'Figma', url: 'https://figma.com' },
          ],
        },
      ],
      ungroupedTabs: [],
    },
  ]);
}

const meta: Meta<typeof ExportWorkspaceDialog> = {
  title: 'Components/UI/Workspace/ExportWorkspaceDialog',
  component: ExportWorkspaceDialog,
  parameters: { layout: 'centered' },
  args: { open: true, onOpenChange: () => {} },
  decorators: [
    (Story) => (
      <ActiveWorkspaceContext.Provider value={sampleContextValue}>
        <Story />
      </ActiveWorkspaceContext.Provider>
    ),
  ],
  beforeEach: async () => {
    await seedWorkspaceData();
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ExportWorkspaceDialogOpen: Story = {};
