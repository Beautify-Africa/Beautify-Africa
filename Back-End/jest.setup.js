// Jest setup file for handling lingering connections after tests
module.exports = async () => {
  // Close any remaining servers or connections
  // This helps with graceful worker exit
  
  // Give timers time to expire with unref
  await new Promise(resolve => setImmediate(resolve));
};
