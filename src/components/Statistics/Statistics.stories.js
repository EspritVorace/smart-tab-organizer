import { Statistics } from './Statistics.tsx';

export default {
  title: 'Components/Statistics',
  component: Statistics,
  argTypes: {
    isLoading: { control: 'boolean' },
    onReset: { action: 'onReset' },
  },
};

export const StatisticsDefault = {
  name: 'Default State',
  args: {
    stats: {
      tabGroupsCreatedCount: 5,
      tabsDeduplicatedCount: 12,
    },
    isLoading: false,
    onReset: () => {},
  },
};

export const StatisticsEmpty = {
  name: 'Empty Statistics',
  args: {
    stats: {
      tabGroupsCreatedCount: 0,
      tabsDeduplicatedCount: 0,
    },
    isLoading: false,
    onReset: () => {},
  },
};

export const StatisticsSingular = {
  name: 'Singular Values',
  args: {
    stats: {
      tabGroupsCreatedCount: 1,
      tabsDeduplicatedCount: 1,
    },
    isLoading: false,
    onReset: () => {},
  },
};

export const StatisticsOneGroupManyTabs = {
  name: 'One Group Many Tabs',
  args: {
    stats: {
      tabGroupsCreatedCount: 1,
      tabsDeduplicatedCount: 15,
    },
    isLoading: false,
    onReset: () => {},
  },
};

export const StatisticsManyGroupsOneTab = {
  name: 'Many Groups One Tab',
  args: {
    stats: {
      tabGroupsCreatedCount: 8,
      tabsDeduplicatedCount: 1,
    },
    isLoading: false,
    onReset: () => {},
  },
};

export const StatisticsHighNumbers = {
  name: 'High Numbers',
  args: {
    stats: {
      tabGroupsCreatedCount: 156,
      tabsDeduplicatedCount: 423,
    },
    isLoading: false,
    onReset: () => {},
  },
};

export const StatisticsLoading = {
  name: 'Loading State',
  args: {
    isLoading: true,
    onReset: () => {},
  },
};

export const StatisticsNull = {
  name: 'Null Statistics',
  args: {
    stats: null,
    isLoading: false,
    onReset: () => {},
  },
};

export const StatisticsUndefined = {
  name: 'Undefined Statistics',
  args: {
    isLoading: false,
    onReset: () => {},
  },
};