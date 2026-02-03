import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: [
      'tests/**/*.test.ts'
    ],
    exclude: [
      // Tests qui nécessitent le WxtVitest plugin (à réactiver quand le problème sera résolu)
      'tests/useStatistics.test.ts',
      'tests/useSyncedSettings.test.ts'
    ]
  }
});
