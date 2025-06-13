import { RulesTab } from '../components/RulesTab.jsx';

export default {
  title: 'Components/RulesTab',
  component: RulesTab,
};

export const Default = {
  args: {
    settings: { domainRules: [], regexPresets: [], logicalGroups: [] },
    updateRules: () => {},
    editingId: null,
    setEditingId: () => {},
  },
};
