module.exports = {
    // Test environment
    testEnvironment: 'node',
    
    // Test file patterns
    testMatch: [
        '**/tests/**/*.test.js',
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
    ],
    
    // Coverage configuration
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    collectCoverageFrom: [
        'routes/**/*.js',
        'middleware/**/*.js',
        'database/**/*.js',
        'public/js/**/*.js',
        '!public/js/performance.js', // Exclude performance.js from coverage for now
        '!**/node_modules/**',
        '!**/tests/**'
    ],
    
    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },
    
    // Setup files
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    
    // Module paths
    moduleDirectories: ['node_modules', '<rootDir>'],
    
    // Transform files
    transform: {},
    
    // Test timeout
    testTimeout: 10000,
    
    // Verbose output
    verbose: true,
    
    // Clear mocks between tests
    clearMocks: true,
    
    // Restore mocks after each test
    restoreMocks: true,
    
    // Error handling
    errorOnDeprecated: true,
    
    // Test environments for different test types
    projects: [
        {
            displayName: 'Backend Tests',
            testMatch: ['**/tests/auth.test.js', '**/tests/chat.test.js'],
            testEnvironment: 'node'
        },
        {
            displayName: 'Frontend Tests',
            testMatch: ['**/tests/frontend.test.js'],
            testEnvironment: 'jsdom',
            setupFilesAfterEnv: ['<rootDir>/tests/frontend-setup.js']
        }
    ]
};