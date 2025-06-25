import type { Preview } from '@storybook/react-vite'
import '../src/styles/radix-themes.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;