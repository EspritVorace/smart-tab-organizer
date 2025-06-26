import { Header } from './Header.jsx';

export default {
  title: 'Components/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    onThemeChange: { action: 'theme-changed' },
  },
};

export const HeaderDefault = {
  name: 'System Theme',
  args: {
    settings: {
      darkModePreference: 'system'
    },
  },
};

export const HeaderLight = {
  name: 'Light Mode',
  args: {
    settings: {
      darkModePreference: 'disabled'
    },
  },
};

export const HeaderDark = {
  name: 'Dark Mode',
  args: {
    settings: {
      darkModePreference: 'enabled'
    },
  },
};