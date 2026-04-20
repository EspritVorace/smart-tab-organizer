import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

export default defineConfig({
  srcDir: 'src',
  outDir: '.output',
  manifest: {
    name: '__MSG_extensionName__',
    description: '__MSG_extensionDescription__',
    version: '1.1.3',
    author: 'EspritVorace',
    homepage_url: 'https://github.com/EspritVorace/smart-tab-organizer',
    default_locale: 'en',
    browser_specific_settings: {
      gecko: {
        id: 'smart-tab-organizer@espritvorace.github.io',
        strict_min_version: '109.0',
        // Required by AMO since 2025: declare that the extension does not
        // collect or transmit any user data. SmartTab Organizer only reads
        // /writes user preferences via browser.storage (local + sync) — no
        // telemetry, no analytics, no external network calls.
          data_collection_permissions: {
            required: ['none']
        }
      }
    },
    permissions: ['tabs', 'tabGroups', 'storage', 'notifications', 'downloads'],
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
  webExt: {
    chromiumProfile: resolve('.chrome-profile'),
    firefoxProfile: resolve('.firefox-profile'),
    keepProfileChanges: true,
    profileCreateIfMissing: true,
  },
  vite: () => ({
    plugins: [react(), tsconfigPaths({ projects: ['./tsconfig.json'] })],
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
