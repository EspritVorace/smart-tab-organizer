import { Tabs } from '../components/Tabs.jsx';

export default {
  title: 'Components/Tabs',
  component: Tabs,
};

export const Default = {
  args: {
    currentTab: 'rules',
    onTabChange: () => {},
  },
};
