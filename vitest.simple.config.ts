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
      // Tests legacy qui utilisent le WxtVitest plugin
      'tests/useStatistics.test.ts',
      'tests/useSyncedSettings.test.ts',
      // Tests de hooks avec storage (problèmes de concurrence React - à exécuter séparément)
      'tests/hooks/useStatistics.test.ts',
      'tests/hooks/useSyncedSettings.test.ts'
    ],
    setupFiles: ['./tests/setup-ui.ts']
  }
});
