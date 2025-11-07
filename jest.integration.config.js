const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  displayName: 'integration',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/jest.integration.setup.js'],
  testTimeout: 30000,
}

module.exports = createJestConfig(customJestConfig)
