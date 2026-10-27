import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config — build tooling per 04_FRONTEND_SPA_PERFORMANCE.md §3
// - Route-level React.lazy splitting is handled in src/app/routes.jsx
// - Vendor code (react, react-dom, react-router) is emitted as a separate,
//   long-term-cacheable chunk so it is not re-downloaded on every deploy.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) {
            return 'vendor';
          }
          if (id.includes('@tanstack')) return 'vendor-query';
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
