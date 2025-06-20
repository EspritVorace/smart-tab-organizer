import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';

export default defineConfig({
  // keep existing source layout
  srcDir: '.',
  entrypointsDir: 'js',
  modulesDir: 'js/modules',
  publicDir: 'public',
  outDir: 'dist',
  vite: () => ({
    plugins: [preact()],
  }),
});
