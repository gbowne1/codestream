import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        goLive: resolve(__dirname, 'go-live.html'),
        watch: resolve(__dirname, 'watch.html'),
      },
    },
  },
  server: {
    port: 5173, // Changed from 3000 to avoid conflict with Express
    open: true,
    proxy: {
      // Any request to /api will now be sent to the Express server
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});