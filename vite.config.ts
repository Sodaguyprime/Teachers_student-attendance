import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Students reach the dev server from their phones over the LAN.
    host: true,
    proxy: {
      // xfwd lets the API see the phone's real address rather than the proxy's,
      // which is what keeps the teacher routes loopback-only during dev.
      '/api': { target: 'http://127.0.0.1:3000', changeOrigin: false, xfwd: true },
    },
  },
  build: { outDir: 'dist/client', emptyOutDir: true },
});
