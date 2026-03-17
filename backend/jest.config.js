/** @type {import('jest').Config} */
module.exports = {
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/__test__/**',
    '!src/**/*.test.ts',
    '!src/index.ts',
  ],
  roots: ['<rootDir>/src'],
  testEnvironment: 'node',
  testMatch: ['**/__test__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json',
      },
    ],
  },
};
