import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx'
    ],
    exclude: [
      // Tests qui nécessitent le WxtVitest plugin (à réactiver quand le problème sera résolu)
      'tests/useStatistics.test.ts',
      'tests/useSyncedSettings.test.ts'
    ],
    setupFiles: ['./tests/setup-ui.ts']
  }
});
