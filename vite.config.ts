import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: './',
  plugins: [
    preact(),
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '.' },
        { src: 'js/**/*', dest: '.' },
        { src: 'icons/*', dest: '.' },
        { src: '_locales/**/*', dest: '.' },
        { src: 'data/**/*', dest: '.' }
      ],
      structured: true
    })
  ],
  build: {
    rollupOptions: {
      input: {
        options: 'options/options.html',
        popup: 'popup/popup.html'
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  }
});
