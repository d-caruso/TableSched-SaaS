module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  passWithNoTests: true,
  moduleNameMapper: {
    '^@/(.*)$': ['<rootDir>/$1', '<rootDir>/node_modules/tablesched-frontend/$1'],
    '^@core/(.*)$': '<rootDir>/node_modules/tablesched-frontend/$1',
    '^@saas/(.*)$': '<rootDir>/$1',
    '^tamagui$': '<rootDir>/__mocks__/tamagui.ts',
    '^@tamagui/core$': '<rootDir>/__mocks__/tamagui.ts',
    '^@tamagui/text$': '<rootDir>/__mocks__/tamagui.ts',
    '^sentry-expo$': '<rootDir>/__mocks__/sentry-expo.ts',
    '^expo-constants$': '<rootDir>/__mocks__/expo-constants.ts',
  },
};
