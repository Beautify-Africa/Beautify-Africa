import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    // Optimize bundle
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
      },
    },
    // Code splitting
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'INVALID_ANNOTATION') return;
        warn(warning);
      },
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (
            normalized.includes('/node_modules/react/') ||
            normalized.includes('/node_modules/react-dom/') ||
            normalized.includes('/node_modules/react-router-dom/') ||
            normalized.includes('/node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }
          if (normalized.includes('/node_modules/framer-motion/')) {
            return 'framer-motion';
          }
          if (
            normalized.includes('/node_modules/@stripe/stripe-js/') ||
            normalized.includes('/node_modules/@stripe/react-stripe-js/')
          ) {
            return 'stripe-vendor';
          }
          if (
            normalized.includes('/node_modules/@tanstack/react-query/') ||
            normalized.includes('/node_modules/@tanstack/react-virtual/')
          ) {
            return 'tanstack-vendor';
          }
          if (
            normalized.includes('/node_modules/sonner/') ||
            normalized.includes('/node_modules/react-helmet-async/') ||
            normalized.includes('/node_modules/react-hook-form/') ||
            normalized.includes('/node_modules/@hookform/resolvers/') ||
            normalized.includes('/node_modules/zod/')
          ) {
            return 'ui-vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true,
    reportCompressedSize: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
});
