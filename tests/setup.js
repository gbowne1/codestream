import { beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment and ensure JWT_SECRET is available
process.env.NODE_ENV = 'test';
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
}

// Export the test JWT secret for use in tests
export const TEST_JWT_SECRET = process.env.JWT_SECRET;

// Global test setup
beforeAll(() => {
  console.log('🧪 Starting backend test suite...');
  console.log('JWT_SECRET:', process.env.JWT_SECRET);
});

afterAll(() => {
  console.log('✅ Backend test suite completed');
});
