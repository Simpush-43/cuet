import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' + HashRouter: the built site works on any static host.
// In dev, /api calls are proxied to the Express server (npm run dev:server).
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { proxy: { '/api': 'http://localhost:4000' } },
});
