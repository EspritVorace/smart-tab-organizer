import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  build: {
    rollupOptions: {
      input: {
        options: 'options/options.html',
        popup: 'popup/popup.html'
      }
    },
    outDir: 'dist',
    emptyOutDir: false
  }
});
