/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.test.ts'],
  moduleNameMapper: {
    // Stub out React Native so pure-logic tests don't need the RN runtime
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
  },
};
