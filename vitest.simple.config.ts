import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Alias wxt/browser → mock-browser (fakeBrowser) pour les tests, sans passer
// par WxtVitest() qui requiert un accès réseau (plugin download).
const mockBrowserPath = path.resolve(__dirname, 'node_modules/wxt/dist/virtual/mock-browser.mjs');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: 'wxt/browser', replacement: mockBrowserPath }],
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx'
    ],
    exclude: [],
    setupFiles: ['./tests/setup.ts', './tests/setup-ui.ts'],
    // Désactiver le parallélisme pour éviter les conflits de state
    fileParallelism: false,
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
