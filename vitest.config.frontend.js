import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // DOM environment for frontend
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '*.config.js',
        'public/',
        'src/assets/',
        'tests/',
      ],
    },
    setupFiles: ['./tests/setup.browser.js'],
    include: ['tests/unit/frontend/**/*.test.js'],
  },
});
