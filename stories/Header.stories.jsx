import { Header } from '../components/Header.jsx';

export default {
  title: 'Components/Header',
  component: Header,
};

export const Default = {
  args: {
    settings: { darkModePreference: 'system' },
    onThemeChange: () => {},
  },
};
