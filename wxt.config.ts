import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';
import license from 'rollup-plugin-license';
import { resolve } from 'path';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { generateI18nTypes } from './scripts/generate-i18n-types.mjs';

// Packages whose code actually ends up in the extension bundle. WXT runs
// several Vite builds in a single process (background, content scripts, HTML
// pages); rollup-plugin-license reports the third-party dependencies of each,
// and this module-scoped map accumulates their union across all of them. The
// set is written to a manifest in the `build:done` hook and consumed by
// `scripts/generate-third-party-licenses.mjs` to scope the attribution to what
// is really redistributed.
//
// Capture is opt-in (CAPTURE_LICENSES=true) so ordinary builds, e2e runs and
// screenshot pipelines pay no cost and never touch the manifest. It is enabled
// only by the `pnpm licenses:generate` script.
const CAPTURE_LICENSES = process.env.CAPTURE_LICENSES === 'true';

const bundledDependencies = new Map<string, { name: string; version: string }>();

const BUNDLED_MANIFEST = resolve('scripts/bundled-dependencies.json');

function writeBundledManifest() {
  const list = [...bundledDependencies.values()].sort(
    (a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version),
  );
  const contents = JSON.stringify(list, null, 2) + '\n';
  // Avoid dirtying git when nothing changed (deterministic, idempotent).
  if (existsSync(BUNDLED_MANIFEST) && readFileSync(BUNDLED_MANIFEST, 'utf-8') === contents) {
    return;
  }
  writeFileSync(BUNDLED_MANIFEST, contents, 'utf-8');
}

// `webExt.profileCreateIfMissing` does not create the parent dir early enough
// for `chrome-launcher`, which opens `chrome-out.log` first and crashes with
// ENOENT on a fresh checkout. Pre-create both profile dirs here.
const chromiumProfile = resolve('.chrome-profile');
const firefoxProfile = resolve('.firefox-profile');
mkdirSync(chromiumProfile, { recursive: true });
mkdirSync(firefoxProfile, { recursive: true });

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
    // Keep the committed `wxt-i18n-structure.d.ts` in sync with the English
    // catalog on every `wxt prepare` (postinstall) and build. The write is
    // idempotent, so this never dirties git unless the keys actually changed.
    'prepare:types': async () => {
      await generateI18nTypes();
    },
    'build:manifestGenerated': (wxt, manifest) => {
      // Firefox MV2 uses `_execute_browser_action`; only Chromium MV3 accepts
      // `_execute_action`. Without this rename the popup hotkey (and on some
      // validators the whole `commands` object) is silently dropped on Firefox.
      if (manifest.manifest_version === 2 && manifest.commands?._execute_action) {
        manifest.commands._execute_browser_action = manifest.commands._execute_action;
        delete manifest.commands._execute_action;
      }
    },
    'build:publicAssets': (_wxt, files) => {
      // Minify every public JSON asset on the way out: WXT copies public/
      // verbatim (pretty-printed), so the shipped files keep their indentation.
      // Stripping it saves ~30 KB total (presets, the three i18n catalogs, the
      // licenses file) while the committed sources stay pretty and
      // hand-editable. Transform each CopiedPublicFile (absoluteSrc) into a
      // GeneratedPublicFile (contents): WXT writes `contents` when `absoluteSrc`
      // is absent (build-entrypoints: `if ("absoluteSrc" in file) copyFile`).
      for (const file of files) {
        if (!file.relativeDest.endsWith('.json')) continue;
        const f = file as {
          relativeDest: string;
          absoluteSrc?: string;
          contents?: string;
        };
        if (!f.absoluteSrc) continue; // already generated, nothing to read
        const minified = JSON.stringify(JSON.parse(readFileSync(f.absoluteSrc, 'utf-8')));
        delete f.absoluteSrc; // switch WXT to the writeFile(contents) branch
        f.contents = minified;
      }
    },
    'build:done': () => {
      // All Vite sub-builds have run; persist the union of bundled packages so
      // the license generator can scope the attribution to what is shipped.
      // Only when capture is explicitly requested, to avoid clobbering the
      // manifest (the accumulator is empty when the plugin is disabled).
      if (CAPTURE_LICENSES) writeBundledManifest();
    },
  },
  manifest: {
    name: '__MSG_extensionName__',
    description: '__MSG_extensionDescription__',
    version: '1.2.3',
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
      // `organize-all-tabs` and `save-current-window-session` ship without a
      // `suggested_key` on purpose. Any letter-based default clashes with
      // built-in browser bindings: on Firefox `Alt+Shift+<letter>` is the
      // web-page accesskey modifier (silently shadowed by pages), and almost
      // every `Ctrl+Shift+<letter>` is already a Firefox built-in. These two
      // stay assignable by the user via chrome://extensions/shortcuts; day to
      // day they are reachable from the popup (open it, then press O / S).
      'organize-all-tabs': {
        description: '__MSG_cmdOrganizeAllTabs__',
      },
      'save-current-window-session': {
        description: '__MSG_cmdSaveSession__',
      },
      // Workspace switching from any tab. No `suggested_key` (same letter
      // -conflict reasoning as the two commands above); the user assigns them
      // via chrome://extensions/shortcuts. In the popup/options the `w n`/`w p`
      // /`w l` in-page sequences cover the same actions.
      'switch-workspace-next': {
        description: '__MSG_cmdSwitchWorkspaceNext__',
      },
      'switch-workspace-prev': {
        description: '__MSG_cmdSwitchWorkspacePrev__',
      },
      'switch-workspace-last': {
        description: '__MSG_cmdSwitchWorkspaceLast__',
      },
      // Single global default: a digit combo avoids the letter conflicts above
      // and is free on Chrome and Firefox (Ctrl+Shift+digit is unbound; plain
      // Ctrl+1..8 selects tabs). On macOS Cmd+Shift+1 is not OS-reserved.
      _execute_action: {
        suggested_key: { default: 'Ctrl+Shift+1' },
      },
    },
    action: {
      default_popup: 'popup.html'
    }
  },
  webExt: {
    chromiumProfile,
    firefoxProfile,
    keepProfileChanges: true,
    profileCreateIfMissing: true,
  },
  vite: () => ({
    plugins: [
      react(),
      // Collect the third-party packages actually included in each bundle.
      // `multipleVersions` keeps distinct versions apart (a package may change
      // its license between versions). The output callback only accumulates;
      // the manifest is written once in the `build:done` hook above. Enabled
      // only when CAPTURE_LICENSES=true (set by `pnpm licenses:generate`), so
      // ordinary builds are not slowed down by the dependency scan.
      ...(CAPTURE_LICENSES
        ? [
            license({
              thirdParty: {
                includePrivate: false,
                multipleVersions: true,
                output: (dependencies) => {
                  for (const dep of dependencies) {
                    if (!dep.name || !dep.version) continue;
                    bundledDependencies.set(`${dep.name}@${dep.version}`, {
                      name: dep.name,
                      version: dep.version,
                    });
                  }
                },
              },
            }),
          ]
        : []),
    ],
    resolve: {
      tsconfigPaths: true,
    },
    build: {
      emptyOutDir: true,
      // JsonCodeEditor (CodeMirror + codemirror-json-schema) is already lazy-loaded
      // and only imported when the import wizard is opened. Extension chunks are
      // served locally so network cost does not apply; suppress the warning.
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash].[ext]',
          chunkFileNames: 'chunks/[name].[hash].js',
          entryFileNames: 'chunks/[name].[hash].js',
        }
      }
    },
    base: './'
  })
});
