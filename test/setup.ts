/**
 * Jest per-test setup.
 * Useful for configuring global test helpers without relying on a specific test framework.
 */

// Ensure unhandled promise rejections fail fast during tests
process.on('unhandledRejection', error => {
  throw error;
});

beforeAll(() => {
  jest.setTimeout(30_000);
});

afterAll(() => {
  jest.setTimeout(5_000);
});







