import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // Default for backend tests
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
    setupFiles: ['./tests/setup.js'],
    include: [
      'tests/unit/backend/**/*.test.js',
      'tests/integration/**/*.test.js',
    ],
  },
});
