import type { StorybookConfig } from '@storybook/react-vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'node:path';

// Resolved relative to this file's directory at runtime. Storybook loads main.ts
// through esbuild-register (CJS), so `import.meta.url` is unavailable; using
// process.cwd() + the known relative path is the portable workaround.
const browserMockPath = resolve(process.cwd(), '.storybook/browser-mock.ts');

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

    // Both `wxt/browser` (used by app code) and `@wxt-dev/browser` (used
    // internally by `@wxt-dev/storage`) must resolve to the SAME singleton,
    // otherwise wxt's storage helpers fall back to `globalThis.chrome` and
    // crash with "Cannot read properties of undefined (reading 'runtime')".
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      'wxt/browser': browserMockPath,
      '@wxt-dev/browser': browserMockPath,
    };

    config.plugins = config.plugins || [];
    config.plugins.push(tsconfigPaths({ projects: ['./tsconfig.json'] }));

    return config;
  },
};
export default config;