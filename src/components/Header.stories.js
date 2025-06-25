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

export const Default = {
  args: {
    settings: {
      darkModePreference: 'system'
    },
  },
};

export const LightMode = {
  args: {
    settings: {
      darkModePreference: 'disabled'
    },
  },
};

export const DarkMode = {
  args: {
    settings: {
      darkModePreference: 'enabled'
    },
  },
};