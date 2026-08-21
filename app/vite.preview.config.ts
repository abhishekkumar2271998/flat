// Scratch config for the analytics preview harness. Not part of the app build.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const outDir =
  'c:/Users/Acer/AppData/Local/Temp/claude/c--Users-Acer-Downloads-flat/e973cb63-e5fa-4733-91bd-dd5a3b3052ec/scratchpad/preview-dist';

export default defineConfig({
  root: 'renderer',
  base: './',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'renderer/src') },
  },
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'renderer/preview.html'),
    },
  },
});
