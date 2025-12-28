/**
 * Test Setup and Configuration
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/military-hq-test';
process.env.JWT_SECRET = 'test-secret-key';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Clean up after all tests
afterAll(async () => {
  // Close database connections
  if (global.mongoServer) {
    await global.mongoServer.stop();
  }
});
