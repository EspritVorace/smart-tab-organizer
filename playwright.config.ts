import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Extensions require sequential execution
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for extension testing
  reporter: 'html',
  timeout: 30000,

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

  // Build extension before running tests
  webServer: {
    command: 'npm run build',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
