import { defineConfig } from '@playwright/test';
import path from 'path';
import * as fs from 'fs';

// Ensure extension is built before tests run
const extensionPath = '.output/chrome-mv3';
if (!fs.existsSync(path.join(extensionPath, 'manifest.json'))) {
  console.error('Extension not built. Run "npm run build" before running tests.');
  process.exit(1);
}

// Each worker launches one browser with the extension loaded (worker-scoped context).
// Multiple workers run test files in parallel: each gets its own isolated Chrome profile.
// Playwright shards by test count, not by duration, so the slowest specs (grouping,
// deduplication, import-export) cluster into shard 1 and make it ~2.5x slower than the
// others. Running 2 workers per shard adds a bit of intra-shard parallelism to absorb that
// imbalance without overloading the 2-core CI runners. Override with E2E_WORKERS if needed.
const defaultWorkers = process.env.CI ? 2 : 3;
const workers = process.env.E2E_WORKERS ? parseInt(process.env.E2E_WORKERS) : defaultWorkers;

// When running sharded in CI, each shard writes a uniquely-named CTRF report so
// artifacts don't collide when downloaded into the same directory for merging.
const shardSuffix = process.env.SHARD_INDEX ? `-shard-${process.env.SHARD_INDEX}` : '';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Tests within a file stay sequential; files run across workers
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry once locally too
  workers,
  timeout: 30000, // Timeout for extension loading
  globalTeardown: './tests/e2e/helpers/a11y-teardown.ts',

  use: {
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        // We'll use a custom fixture for loading the extension
      },
    },
  ],
  reporter: [
    ['playwright-ctrf-json-reporter', { outputDir: 'ctrf', outputFile: `e2e-ctrf-report${shardSuffix}.json` }],
  ],
  headless: false, // Extensions require headed mode
});
