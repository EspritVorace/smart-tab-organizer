import type { Meta, StoryObj } from '@storybook/react';
import { LogicalGroupDialog } from './LogicalGroupDialog';
const action = (name: string) => (...args: any[]) => console.log(name, ...args);
import type { LogicalGroup } from '../../../schemas/logicalGroup';
import type { SyncSettings } from '../../../types/syncSettings';

const mockSyncSettings: SyncSettings = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
  darkModePreference: 'system',
  regexPresets: [],
  logicalGroups: [
    {
      id: 'existing-group-1',
      label: 'Existing Group',
      color: 'blue'
    },
    {
      id: 'existing-group-2',
      label: 'Another Group',
      color: 'green'
    }
  ],
  domainRules: []
};

const mockLogicalGroup: LogicalGroup = {
  id: 'group-1',
  label: 'Development',
  color: 'blue'
};

const meta: Meta<typeof LogicalGroupDialog> = {
  title: 'Components/Core/LogicalGroup/LogicalGroupDialog',
  component: LogicalGroupDialog,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
    },
    logicalGroup: {
      control: 'object',
    },
  },
  args: {
    onClose: action('onClose'),
    onSubmit: action('onSubmit'),
    syncSettings: mockSyncSettings,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// === CRÉATION ET ÉDITION ===

export const LogicalGroupDialogCreate: Story = {
  args: {
    isOpen: true,
    logicalGroup: undefined,
  },
};

export const LogicalGroupDialogEdit: Story = {
  args: {
    isOpen: true,
    logicalGroup: mockLogicalGroup,
  },
};

// === DIFFÉRENTES COULEURS ===

export const LogicalGroupDialogRedColor: Story = {
  args: {
    isOpen: true,
    logicalGroup: {
      id: 'group-2',
      label: 'Critical Issues',
      color: 'red'
    },
  },
};

export const LogicalGroupDialogGreenColor: Story = {
  args: {
    isOpen: true,
    logicalGroup: {
      id: 'group-3',
      label: 'Testing',
      color: 'green'
    },
  },
};

export const LogicalGroupDialogPurpleColor: Story = {
  args: {
    isOpen: true,
    logicalGroup: {
      id: 'group-4',
      label: 'Documentation',
      color: 'purple'
    },
  },
};

export const LogicalGroupDialogYellowColor: Story = {
  args: {
    isOpen: true,
    logicalGroup: {
      id: 'group-5',
      label: 'Pending Review',
      color: 'yellow'
    },
  },
};

export const LogicalGroupDialogOrangeColor: Story = {
  args: {
    isOpen: true,
    logicalGroup: {
      id: 'group-6',
      label: 'In Progress',
      color: 'orange'
    },
  },
};

export const LogicalGroupDialogCyanColor: Story = {
  args: {
    isOpen: true,
    logicalGroup: {
      id: 'group-7',
      label: 'Research',
      color: 'cyan'
    },
  },
};

export const LogicalGroupDialogPinkColor: Story = {
  args: {
    isOpen: true,
    logicalGroup: {
      id: 'group-8',
      label: 'Design',
      color: 'pink'
    },
  },
};

export const LogicalGroupDialogGreyColor: Story = {
  args: {
    isOpen: true,
    logicalGroup: {
      id: 'group-9',
      label: 'Archived',
      color: 'grey'
    },
  },
};

// === CAS LIMITES ===

export const LogicalGroupDialogClosed: Story = {
  args: {
    isOpen: false,
    logicalGroup: undefined,
  },
};

export const LogicalGroupDialogWithLongName: Story = {
  args: {
    isOpen: true,
    logicalGroup: {
      id: 'group-10',
      label: 'Very Long Logical Group Name That Should Be Handled Properly',
      color: 'blue'
    },
  },
};