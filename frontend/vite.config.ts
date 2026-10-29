import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  // Keep module paths stable in restricted Windows checkouts and linked folders.
  resolve: { preserveSymlinks: true },
  build: { rollupOptions: { preserveSymlinks: true } },
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
  preview: {
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
});
