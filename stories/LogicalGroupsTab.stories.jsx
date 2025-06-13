import { LogicalGroupsTab } from '../components/LogicalGroupsTab.jsx';

export default {
  title: 'Components/LogicalGroupsTab',
  component: LogicalGroupsTab,
};

export const Default = {
  args: {
    settings: { logicalGroups: [] },
    setSettings: () => {},
    editingId: null,
    setEditingId: () => {},
  },
};
