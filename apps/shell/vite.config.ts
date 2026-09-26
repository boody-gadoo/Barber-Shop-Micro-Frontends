import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    cors: true,
    host: true,
    proxy: {
      '/__mfe/services': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
      },
      '/__mfe/booking': {
        target: 'http://127.0.0.1:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/__mfe\/booking/, ''),
      },
    },
  },
  preview: {
    port: 5000,
    strictPort: true,
    cors: true,
  },
  publicDir: '../../public',
  build: {
    target: 'ES2022',
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'],
        passes: 3, // Run compression 3 times for better optimization
      },
      mangle: true,
      format: {
        comments: false, // Remove all comments
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules/react')) return 'chunk-react';
          if (id.includes('node_modules/react-dom')) return 'chunk-react-dom';
          if (id.includes('node_modules/react-router-dom')) return 'chunk-router';
          // Design system chunks
          if (id.includes('@design-tokens')) return 'chunk-design-tokens';
          // API contracts
          if (id.includes('@api-contracts') || id.includes('@shared-types')) return 'chunk-api';
          // Shared packages
          if (id.includes('@barber-shop/shared')) return 'chunk-shared';
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|gif|svg|webp/.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2|ttf|otf|eot/.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
      },
    },
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true, // Extract CSS to separate files for better caching
  },
});
