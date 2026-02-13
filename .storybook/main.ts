import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "../src/stories/Welcome.stories.tsx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-docs",
    "@storybook/addon-vitest"
  ],
  "framework": {
    "name": "@storybook/react-vite",
    "options": {}
  },
  staticDirs: ['../public'],
  async viteFinal(config) {
    // Mock pour wxt/browser dans Storybook
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      'wxt/browser': '/virtual:wxt-browser',
    };
    
    config.plugins = config.plugins || [];
    config.plugins.push({
      name: 'mock-wxt-browser',
      resolveId(id) {
        if (id === '/virtual:wxt-browser') return id;
      },
      load(id) {
        if (id === '/virtual:wxt-browser') {
          return `
            const mockBrowser = {
              i18n: {
                getMessage: (key) => {
                  const locale = globalThis.currentLocale || 'en';
                  const messages = globalThis.messagesCache?.[locale] || {};
                  return messages[key]?.message || key;
                }
              }
            };
            export { mockBrowser as browser };
            export default mockBrowser;
          `;
        }
      },
    });
    
    return config;
  },
};
export default config;