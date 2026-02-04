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
      // Tests legacy (ancienne implémentation)
      'tests/useStatistics.test.ts',
      'tests/useSyncedSettings.test.ts'
    ],
    setupFiles: ['./tests/setup.ts', './tests/setup-ui.ts'],
    // Désactiver le parallélisme pour éviter les conflits de state
    fileParallelism: false
  }
});
