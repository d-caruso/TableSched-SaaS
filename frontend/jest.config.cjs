const moduleNameMapper = {
  '^@/tamagui\\.config$': '<rootDir>/__mocks__/tamagui.config.ts',
  '^@/(.*)$': ['<rootDir>/$1', '<rootDir>/node_modules/tablesched-frontend/$1'],
  '^@core/(.*)$': '<rootDir>/node_modules/tablesched-frontend/$1',
  '^@saas/(.*)$': '<rootDir>/$1',
  '^tamagui$': '<rootDir>/__mocks__/tamagui.ts',
  '^@tamagui/core$': '<rootDir>/__mocks__/tamagui.ts',
  '^@tamagui/text$': '<rootDir>/__mocks__/tamagui.ts',
  '^sentry-expo$': '<rootDir>/__mocks__/sentry-expo.ts',
  '^expo-constants$': '<rootDir>/__mocks__/expo-constants.ts',
};

module.exports = {
  projects: [
    {
      displayName: 'unit',
      preset: 'jest-expo',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/__tests__/integration/',
        '<rootDir>/e2e/',
      ],
      moduleNameMapper,
    },
    {
      displayName: 'integration',
      preset: 'jest-expo',
      testEnvironment: 'jest-fixed-jsdom',
      testEnvironmentOptions: { customExportConditions: [''] },
      setupFilesAfterEnv: [
        '<rootDir>/jest.setup.js',
        '<rootDir>/jest.setup.msw.js',
      ],
      testRegex: '/__tests__/integration/.*\\.integration\\.test\\.tsx?$',
      testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/e2e/'],
      moduleNameMapper,
    },
  ],
};
