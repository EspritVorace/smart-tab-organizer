import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';

export default defineConfig({
  outDir: 'dist',
  vite: () => ({
    plugins: [preact()],
  }),
});
