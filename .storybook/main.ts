import type { StorybookConfig } from '@storybook/react-vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const config: StorybookConfig = {
  "stories": [
    "../src/stories/Welcome.stories.tsx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-docs",
    "@storybook/addon-a11y"
  ],
  "framework": {
    "name": "@storybook/react-vite",
    "options": {}
  },
  staticDirs: ['../public'],
  async viteFinal(config) {
    // Disable Vite's automatic publicDir detection: staticDirs already copies
    // ../public, and letting Vite do it in parallel triggers an EEXIST race
    // when sibling sub-directories (_locales/fr, _locales/es, ...) get mkdir'd
    // twice during the build.
    config.publicDir = false;

    // Mock pour wxt/browser dans Storybook
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      'wxt/browser': '/virtual:wxt-browser',
    };
    
    config.plugins = config.plugins || [];
    config.plugins.push(tsconfigPaths({ projects: ['./tsconfig.json'] }));
    config.plugins.push({
      name: 'mock-wxt-browser',
      resolveId(id) {
        if (id === '/virtual:wxt-browser') return id;
      },
      load(id) {
        if (id === '/virtual:wxt-browser') {
          return `
            function resolveMessage(entry, substitutions) {
              let msg = entry.message;
              if (entry.placeholders) {
                for (const [name, p] of Object.entries(entry.placeholders)) {
                  msg = msg.split('$' + name + '$').join(p.content);
                }
              }
              if (substitutions !== undefined) {
                const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
                msg = msg.replace(/\\$(\\d+)/g, (m, n) => subs[Number(n) - 1] ?? m);
              }
              return msg;
            }
            const mockBrowser = {
              i18n: {
                getMessage: (key, substitutions) => {
                  const locale = globalThis.currentLocale || 'en';
                  const messages = globalThis.messagesCache?.[locale] || {};
                  const entry = messages[key];
                  if (!entry) return key;
                  return resolveMessage(entry, substitutions);
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