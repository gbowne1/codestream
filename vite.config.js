import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    // Use a different port than the API server
    port: 3001,
    open: true,
    // Allow importing files from one level up (src/ is outside public/)
    fs: {
      strict: false,
      allow: ['..'],
    },
    // Proxy API calls to the Express server
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
