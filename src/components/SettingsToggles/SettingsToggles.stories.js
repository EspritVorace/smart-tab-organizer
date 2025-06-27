import { SettingsToggles } from './SettingsToggles.tsx';

export default {
  title: 'Components/SettingsToggles',
  component: SettingsToggles,
  argTypes: {
    globalGroupingEnabled: { control: 'boolean' },
    globalDeduplicationEnabled: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    onGroupingChange: { action: 'onGroupingChange' },
    onDeduplicationChange: { action: 'onDeduplicationChange' },
  },
};

export const SettingsTogglesDefault = {
  name: 'Default Settings',
  args: {
    globalGroupingEnabled: true,
    globalDeduplicationEnabled: false,
    isLoading: false,
    onGroupingChange: () => {},
    onDeduplicationChange: () => {},
  },
};

export const SettingsTogglesAllEnabled = {
  name: 'All Enabled',
  args: {
    globalGroupingEnabled: true,
    globalDeduplicationEnabled: true,
    isLoading: false,
    onGroupingChange: () => {},
    onDeduplicationChange: () => {},
  },
};

export const SettingsTogglesAllDisabled = {
  name: 'All Disabled',
  args: {
    globalGroupingEnabled: false,
    globalDeduplicationEnabled: false,
    isLoading: false,
    onGroupingChange: () => {},
    onDeduplicationChange: () => {},
  },
};

export const SettingsTogglesLoading = {
  name: 'Loading State',
  args: {
    isLoading: true,
  },
};