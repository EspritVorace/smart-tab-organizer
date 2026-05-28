import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Alias wxt/browser to mock-browser (fakeBrowser) for the tests, without going
// through WxtVitest() which requires network access (plugin download).
const mockBrowserPath = path.resolve(__dirname, 'node_modules/wxt/dist/virtual/mock-browser.mjs');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: 'wxt/browser', replacement: mockBrowserPath }],
    tsconfigPaths: true,
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    // codemirror-json-schema ships ESM with extensionless relative imports
    // (e.g. `./features/completion`), which Node's native loader cannot
    // resolve. Inlining routes it through Vite's resolver, like the WXT build.
    server: { deps: { inline: ['codemirror-json-schema'] } },
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx'
    ],
    exclude: [],
    setupFiles: ['./tests/setup.ts', './tests/setup-ui.ts', './tests/setup-storybook.ts'],
    // File-level parallelism is safe: each Vitest worker has its own module
    // context, so fakeBrowser and i18n are isolated per worker.
    fileParallelism: true,
    reporters: [
      'default',
      ['vitest-ctrf-json-reporter', { outputDir: 'ctrf', outputFile: 'unit-ctrf-report.json' }],
    ],
    coverage: {
      provider: 'v8',
      // text = console summary, json-summary = machine-readable for CTRF injection
      reporter: ['text', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/entrypoints/**',
        'src/**/*.stories.{ts,tsx}',
        'src/types/**',
      ],
    },
  },
});
