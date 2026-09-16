// Jest setup file for handling lingering connections after tests
afterAll(async () => {
  await new Promise((resolve) => setImmediate(resolve));
});
