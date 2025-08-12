// Global test setup
const { initializeDatabase, closeDatabase } = require('../database/init');

// Increase timeout for database operations
jest.setTimeout(30000);

// Global setup
beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Suppress console logs during tests unless debugging
    if (!process.env.DEBUG_TESTS) {
        console.log = jest.fn();
        console.warn = jest.fn();
        console.error = jest.fn();
    }
});

// Global teardown
afterAll(async () => {
    // Clean up any remaining resources
    if (global.gc) {
        global.gc();
    }
});

// Mock external dependencies
jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-id' }))
    }))
}));

// Mock file system operations for tests
jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    writeFileSync: jest.fn(),
    readFileSync: jest.fn(),
    existsSync: jest.fn(() => true)
}));

// Custom matchers
expect.extend({
    toBeValidJWT(received) {
        const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
        const pass = jwtRegex.test(received);
        
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid JWT`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid JWT`,
                pass: false,
            };
        }
    },
    
    toBeValidEmail(received) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const pass = emailRegex.test(received);
        
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid email`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid email`,
                pass: false,
            };
        }
    }
});

// Helper functions for tests
global.testHelpers = {
    // Create a test user
    createTestUser: async () => {
        const { createUser } = require('../database/users');
        const bcrypt = require('bcryptjs');
        
        const hashedPassword = await bcrypt.hash('testpassword', 12);
        return await createUser({
            username: `testuser_${Date.now()}`,
            email: `test_${Date.now()}@example.com`,
            password: hashedPassword
        });
    },
    
    // Generate test JWT token
    generateTestToken: (payload = { id: 1, username: 'testuser' }) => {
        const { generateToken } = require('../middleware/auth');
        return generateToken(payload);
    },
    
    // Wait for a specified time
    wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    
    // Generate random string
    randomString: (length = 10) => {
        return Math.random().toString(36).substring(2, length + 2);
    }
};