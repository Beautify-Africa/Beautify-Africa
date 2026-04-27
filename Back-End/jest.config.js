module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  // forceExit is set to true because supertest/Express creates ephemeral HTTP servers
  // for each test, and while all tests pass, these servers sometimes have lingering
  // connections that prevent Jest workers from exiting gracefully. forceExit ensures
  // Jest terminates cleanly after all tests complete. This is a known pattern with
  // Express/supertest integration testing. See: https://github.com/jestjs/jest/issues/11374
  forceExit: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
