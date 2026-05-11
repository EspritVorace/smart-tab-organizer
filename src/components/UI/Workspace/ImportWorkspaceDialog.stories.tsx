import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent } from 'storybook/test';
import { ActiveWorkspaceContext, type ActiveWorkspaceContextValue } from '@/contexts/ActiveWorkspaceContext';
import { defineWorkspaceItems, DEFAULT_WORKSPACE_ID } from '@/utils/workspaceStorage';
import type { WorkspaceMeta } from '@/schemas/workspace';
import { ImportWorkspaceDialog } from './ImportWorkspaceDialog';

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

const sampleImportPayload = {
  workspace: { name: 'Imported workspace', accentColor: 'jade' },
  settings: {
    globalGroupingEnabled: true,
    globalDeduplicationEnabled: true,
    deduplicateUnmatchedDomains: false,
    deduplicationKeepStrategy: 'keep-grouped-or-new',
    notifyOnGrouping: true,
    notifyOnDeduplication: true,
  },
  domainRules: [
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
  ],
  categories: [],
  sessions: [],
  note: 'Backup snapshot taken before the big migration.',
};

const meta: Meta<typeof ImportWorkspaceDialog> = {
  title: 'Components/UI/Workspace/ImportWorkspaceDialog',
  component: ImportWorkspaceDialog,
  parameters: { layout: 'centered' },
  args: { open: true, onOpenChange: () => {} },
  decorators: [
    (Story) => (
      <ActiveWorkspaceContext.Provider value={sampleContextValue}>
        <Story />
      </ActiveWorkspaceContext.Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ImportWorkspaceDialogIdle: Story = {};

export const ImportWorkspaceDialogTextMode: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const segmentedItems = body.getAllByText(/JSON|texte|text/i);
    const textItem = segmentedItems.find(
      (el) => el.closest('.rt-SegmentedControlItem'),
    );
    if (textItem) await userEvent.click(textItem);
  },
};

export const ImportWorkspaceDialogValidPayload: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const segmentedItems = body.getAllByText(/JSON|texte|text/i);
    const textItem = segmentedItems.find(
      (el) => el.closest('.rt-SegmentedControlItem'),
    );
    if (textItem) await userEvent.click(textItem);
    const textarea = body.getByPlaceholderText(/workspace/i);
    await userEvent.click(textarea);
    await userEvent.paste(JSON.stringify(sampleImportPayload, null, 2));
  },
};
