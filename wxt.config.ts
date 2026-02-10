import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

export default defineConfig({
  srcDir: 'src',
  outDir: '.output',
  manifest: {
    name: '__MSG_extensionName__',
    description: '__MSG_extensionDescription__',
    version: '1.0.3',
    author: 'EspritVorace',
    homepage_url: 'https://github.com/EspritVorace/smart-tab-organizer',
    default_locale: 'en',
    permissions: ['tabs', 'tabGroups', 'storage', 'notifications'],
    host_permissions: ['<all_urls>'],
    action: {
      default_icon: {
        '16': 'icons/icon16.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png'
      },
      default_popup: 'popup.html'
    },
    icons: {
      '16': 'icons/icon16.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png'
    }
  },
  vite: () => ({
    plugins: [react()],
    build: {
      emptyOutDir: true,
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash].[ext]',
          chunkFileNames: 'chunks/[name].[hash].js',
          entryFileNames: 'chunks/[name].[hash].js'
        }
      }
    },
    base: './'
  })
});
