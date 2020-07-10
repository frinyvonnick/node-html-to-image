// Set the timeout to 1 minute to allow Tessarect plenty of time to run
jest.setTimeout(1000 * 60);

// Retry failed twice just in case Tessarect still fails
jest.retryTimes(2);