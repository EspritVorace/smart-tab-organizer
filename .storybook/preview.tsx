import React from 'react';
import type { Preview } from '@storybook/react'
import { Theme } from '@radix-ui/themes'
import '../src/styles/radix-themes.css'

// Mock simple pour getMessage qui retourne juste la clé
(global as any).browser = {
  i18n: {
    getMessage: (key: string) => key
  }
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <Theme>
        <div style={{ padding: '20px', maxWidth: '400px' }}>
          <Story />
        </div>
      </Theme>
    ),
  ],
};

export default preview;