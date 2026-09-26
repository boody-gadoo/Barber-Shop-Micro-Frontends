import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/single-spa.tsx',
      formats: ['es'],
      fileName: () => 'single-spa.js',
    },
    outDir: 'dist',
    emptyOutDir: false,
    target: 'ES2022',
  },
});