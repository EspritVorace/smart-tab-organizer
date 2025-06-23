import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';

export default defineConfig({
  srcDir: 'src',
  outDir: '.output',
  manifest: {
    manifest_version: 3,
    name: '__MSG_extensionName__',
    description: '__MSG_extensionDescription__',
    version: '1.0.1',
    author: 'EspritVorace',
    homepage_url: 'https://github.com/EspritVorace/smart-tab-organizer',
    default_locale: 'fr',
    permissions: ['tabs', 'tabGroups', 'storage'],
    host_permissions: ['<all_urls>'],
    action: {
      default_icon: {
        '16': 'icons/icon16.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png'
      }
    },
    icons: {
      '16': 'icons/icon16.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png'
    }
  },
  vite: () => ({
    plugins: [preact()],
    build: {
      emptyOutDir: true
    }
  })
});
