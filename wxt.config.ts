import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';

export default defineConfig({
  srcDir: 'src',
  outDir: 'dist',
  manifest: {
    name: '__MSG_extensionName__',
    description: '__MSG_extensionDescription__',
    default_locale: 'fr',
    permissions: ['tabs', 'tabGroups', 'storage'],
    host_permissions: ['<all_urls>'],
    background: {
      service_worker: 'entrypoints/background.js',
      type: 'module',
    },
    content_scripts: [
      {
        matches: ['<all_urls>'],
        js: ['entrypoints/content.js'],
        run_at: 'document_start',
        all_frames: false,
      },
    ],
    action: {
      default_popup: 'entrypoints/popup/index.html',
      default_icon: {
        '16': 'icons/icon16.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png',
      },
    },
    options_page: 'entrypoints/options/index.html',
    icons: {
      '16': 'icons/icon16.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png',
    },
  },
  vite: () => ({
    plugins: [preact()],
  }),
});
