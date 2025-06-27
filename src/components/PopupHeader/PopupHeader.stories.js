import { PopupHeader } from './PopupHeader.tsx';

export default {
  title: 'Components/PopupHeader',
  component: PopupHeader,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onSettingsOpen: { action: 'settings-opened' },
  },
};

export const PopupHeaderDefault = {
  name: 'Default Header',
  args: {
    title: 'Smart Tab Organizer',
  },
};

export const PopupHeaderShort = {
  name: 'Short Title',
  args: {
    title: 'Tabs',
  },
};

export const PopupHeaderLong = {
  name: 'Long Title',
  args: {
    title: 'Smart Tab Organizer Extension',
  },
};