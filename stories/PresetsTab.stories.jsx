import { PresetsTab } from '../components/PresetsTab.jsx';

export default {
  title: 'Components/PresetsTab',
  component: PresetsTab,
};

export const Default = {
  args: {
    settings: { regexPresets: [] },
    updatePresets: () => {},
    updateRules: () => {},
    editingId: null,
    setEditingId: () => {},
  },
};
