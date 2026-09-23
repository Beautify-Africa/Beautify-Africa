import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import { fileURLToPath, URL } from 'node:url';

// Security guard: guarantees private keys, database credentials, and admin secrets are NEVER exposed to client bundles
function bundleSecretLeakScanner() {
  const FORBIDDEN_ENV_KEYS = [
    /service_role/i,
    /service-role/i,
    /supabase_secret/i,
    /jwt_secret/i,
    /database_url/i,
    /postgres_password/i,
    /redis_password/i,
    /stripe_secret_key/i,
    /stripe_webhook_secret/i,
    /paystack_secret_key/i,
    /cloudinary_api_secret/i,
    /resend_api_key/i,
    /private_key/i,
    /secret_key/i,
  ];

  const SENSITIVE_CONTENT_PATTERNS = [
    /sk_live_[0-9a-zA-Z]{24,}/,
    /sk_test_[0-9a-zA-Z]{24,}/,
    /whsec_[0-9a-zA-Z]{24,}/,
    /-----BEGIN (?:RSA|EC|OPENSSH|PGP|PRIVATE) KEY-----/,
    /postgres:\/\/[^:]+:[^@]+@/,
    /redis:\/\/:[^@]+@/,
  ];

  return {
    name: 'bundle-secret-leak-scanner',
    configResolved(config) {
      const rawEnv = config.env || {};
      for (const [key, value] of Object.entries(rawEnv)) {
        if (!value) continue;
        for (const pattern of FORBIDDEN_ENV_KEYS) {
          if (pattern.test(key)) {
            throw new Error(
              `[SECURITY VIOLATION] Sensitive secret key '${key}' detected in client Vite environment! Client bundles must never access server secrets.`
            );
          }
        }
      }
    },
    generateBundle(options, bundle) {
      for (const [fileName, fileInfo] of Object.entries(bundle)) {
        const content = fileInfo.type === 'chunk' ? fileInfo.code : fileInfo.source;
        if (typeof content !== 'string') continue;

        for (const pattern of SENSITIVE_CONTENT_PATTERNS) {
          if (pattern.test(content)) {
            throw new Error(
              `[SECURITY VIOLATION] Detected sensitive secret pattern matching ${pattern} in client bundle asset '${fileName}'. Build aborted.`
            );
          }
        }
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  envPrefix: ['VITE_'],
  esbuild: {
    jsx: 'automatic',
  },
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    tailwindcss(),
    bundleSecretLeakScanner(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
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
