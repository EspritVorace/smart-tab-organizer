import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  srcDir: 'src',
  outDir: '.output',
  modules: ['@wxt-dev/auto-icons'],
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
    sizes: [16, 32, 48, 96, 128],
    developmentIndicator: 'overlay',
  },
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      // Firefox MV2 uses `_execute_browser_action`; only Chromium MV3 accepts
      // `_execute_action`. Without this rename the popup hotkey (and on some
      // validators the whole `commands` object) is silently dropped on Firefox.
      if (manifest.manifest_version === 2 && manifest.commands?._execute_action) {
        manifest.commands._execute_browser_action = manifest.commands._execute_action;
        delete manifest.commands._execute_action;
      }
    },
  },
  manifest: {
    name: '__MSG_extensionName__',
    description: '__MSG_extensionDescription__',
    version: '1.2.0',
    author: 'EspritVorace',
    homepage_url: 'https://github.com/EspritVorace/smart-tab-organizer',
    default_locale: 'en',
    browser_specific_settings: {
      gecko: {
        id: 'smart-tab-organizer@espritvorace.github.io',
        strict_min_version: '109.0',
        // Required by AMO since 2025: declare that the extension does not
        // collect or transmit any user data. SmartTab Organizer only reads
        // /writes user preferences via browser.storage (local) — no
        // telemetry, no analytics, no external network calls.
          data_collection_permissions: {
            required: ['none']
        }
      }
    },
    permissions: ['tabs', 'tabGroups', 'storage', 'notifications'],
    host_permissions: ['<all_urls>'],
    commands: {
      'organize-all-tabs': {
        suggested_key: { default: 'Alt+Shift+O' },
        description: '__MSG_cmdOrganizeAllTabs__',
      },
      'save-current-window-session': {
        suggested_key: { default: 'Alt+Shift+S' },
        description: '__MSG_cmdSaveSession__',
      },
      _execute_action: {
        suggested_key: { default: 'Alt+Shift+P' },
      },
    },
    action: {
      default_popup: 'popup.html'
    }
  },
  webExt: {
    chromiumProfile: resolve('.chrome-profile'),
    firefoxProfile: resolve('.firefox-profile'),
    keepProfileChanges: true,
    profileCreateIfMissing: true,
  },
  vite: () => ({
    plugins: [react()],
    resolve: {
      tsconfigPaths: true,
    },
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
