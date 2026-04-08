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
// Multiple workers run test files in parallel — each gets its own isolated Chrome profile.
// Keep workers at 1 in CI to avoid resource contention; locally 3 workers run ~3x faster.
const workers = process.env.CI ? 1 : (process.env.E2E_WORKERS ? parseInt(process.env.E2E_WORKERS) : 3);

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
