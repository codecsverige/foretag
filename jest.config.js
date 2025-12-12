module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // Module paths
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Transform files
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/serviceWorker.js',
    '!src/firebase/**',
    '!src/**/*.test.{js,jsx}',
    '!src/**/__tests__/**'
  ],
  
  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx}'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  
  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  }
};