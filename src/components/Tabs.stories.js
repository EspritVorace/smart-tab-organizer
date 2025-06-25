import { Tabs } from './Tabs.jsx';

export default {
  title: 'Components/Tabs',
  component: Tabs,
  argTypes: {
    onTabChange: { action: 'tab-changed' },
  },
};

export const RulesTabActive = {
  args: {
    currentTab: 'rules',
  },
};

export const PresetsTabActive = {
  args: {
    currentTab: 'presets',
  },
};

export const LogicalGroupsTabActive = {
  args: {
    currentTab: 'logicalGroups',
  },
};

export const ImportExportTabActive = {
  args: {
    currentTab: 'importexport',
  },
};

export const StatsTabActive = {
  args: {
    currentTab: 'stats',
  },
};