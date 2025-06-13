import { StatsTab } from '../components/StatsTab.jsx';

export default {
  title: 'Components/StatsTab',
  component: StatsTab,
};

export const Default = {
  args: {
    stats: { createdGroups: 0, deduplicatedTabs: 0 },
    onReset: () => {},
  },
};
