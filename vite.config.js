import { defineConfig } from 'vite';

export default defineConfig({
  
  build: {
    outDir: '../dist',
    emptyOutDir: true,
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