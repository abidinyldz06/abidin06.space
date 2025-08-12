/**
 * Frontend Tests using Jest and jsdom
 * These tests run in a simulated browser environment
 */

// Mock DOM environment
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Setup DOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.localStorage = dom.window.localStorage;
global.sessionStorage = dom.window.sessionStorage;
global.fetch = jest.fn();

// Load HTML content
const htmlContent = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
document.documentElement.innerHTML = htmlContent;

// Load JavaScript files
const performanceJs = fs.readFileSync(path.join(__dirname, '../public/js/performance.js'), 'utf8');
const apiJs = fs.readFileSync(path.join(__dirname, '../public/js/api.js'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../public/js/app.js'), 'utf8');

// Execute JavaScript in DOM context
eval(performanceJs);
eval(apiJs);
eval(appJs);

describe('Frontend Components', () => {
    beforeEach(() => {
        // Reset DOM state
        document.body.innerHTML = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
        
        // Reset localStorage
        localStorage.clear();
        
        // Reset fetch mock
        fetch.mockClear();
    });

    describe('AppState', () => {
        test('should initialize with correct default state', () => {
            const appState = new AppState();
            
            expect(appState.isAuthenticated).toBe(false);
            expect(appState.user).toBe(null);
            expect(appState.token).toBe(null);
        });

        test('should handle token from localStorage', () => {
            localStorage.setItem('authToken', 'test-token');
            const appState = new AppState();
            
            expect(appState.token).toBe('test-token');
        });

        test('should update user display', () => {
            const appState = new AppState();
            const mockUser = { username: 'testuser', email: 'test@example.com' };
            
            // Add user name element to DOM
            document.body.innerHTML += '<span id="user-name"></span>';
            
            appState.setUser(mockUser);
            
            expect(appState.isAuthenticated).toBe(true);
            expect(appState.user).toEqual(mockUser);
            expect(document.getElementById('user-name').textContent).toBe('testuser');
        });
    });

    describe('AuthManager', () => {
        let authManager;
        let appState;

        beforeEach(() => {
            // Add required DOM elements
            document.body.innerHTML += `
                <button id="login-btn">Login</button>
                <button id="logout-btn">Logout</button>
                <div id="login-modal" class="hidden">
                    <button id="close-modal">Close</button>
                    <form id="login-form">
                        <input id="username" name="username" />
                        <input id="password" name="password" />
                        <input id="remember-me" type="checkbox" />
                        <button type="submit">Submit</button>
                    </form>
                    <div id="error-message" class="hidden"></div>
                    <div id="success-message" class="hidden"></div>
                </div>
            `;

            appState = new AppState();
            authManager = new AuthManager(appState);
        });

        test('should show login modal when login button clicked', () => {
            const loginBtn = document.getElementById('login-btn');
            const modal = document.getElementById('login-modal');
            
            loginBtn.click();
            
            expect(modal.classList.contains('hidden')).toBe(false);
        });

        test('should hide login modal when close button clicked', () => {
            const closeBtn = document.getElementById('close-modal');
            const modal = document.getElementById('login-modal');
            
            // Show modal first
            modal.classList.remove('hidden');
            
            closeBtn.click();
            
            expect(modal.classList.contains('hidden')).toBe(true);
        });

        test('should validate form fields', () => {
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            
            // Test username validation
            usernameInput.value = 'ab'; // Too short
            const isUsernameValid = authManager.validateField(usernameInput, 'username');
            expect(isUsernameValid).toBe(false);
            
            // Test password validation
            passwordInput.value = '123'; // Too short
            const isPasswordValid = authManager.validateField(passwordInput, 'password');
            expect(isPasswordValid).toBe(false);
        });

        test('should handle successful login', async () => {
            // Mock successful API response
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    token: 'test-token',
                    user: { username: 'testuser' }
                })
            });

            const form = document.getElementById('login-form');
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            
            usernameInput.value = 'testuser';
            passwordInput.value = 'password123';
            
            // Simulate form submission
            const submitEvent = new Event('submit');
            await authManager.handleLogin(submitEvent);
            
            expect(fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    username: 'testuser',
                    password: 'password123',
                    remember: false
                })
            }));
        });
    });

    describe('UIComponents', () => {
        let uiComponents;

        beforeEach(() => {
            uiComponents = new UIComponents();
        });

        test('should show toast notification', () => {
            uiComponents.showToast('Test message', 'success');
            
            const toast = document.querySelector('.toast');
            expect(toast).toBeTruthy();
            expect(toast.textContent).toContain('Test message');
            expect(toast.classList.contains('success')).toBe(true);
        });

        test('should detect current breakpoint', () => {
            // Mock window.innerWidth
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 1200,
            });
            
            const breakpoint = uiComponents.getCurrentBreakpoint();
            expect(breakpoint).toBe('lg');
        });

        test('should handle ripple effect', () => {
            // Add button with ripple class
            document.body.innerHTML += '<button class="ripple">Test Button</button>';
            
            const button = document.querySelector('.ripple');
            const clickEvent = new MouseEvent('click', {
                clientX: 100,
                clientY: 100
            });
            
            button.dispatchEvent(clickEvent);
            
            // Check if ripple effect was added
            const ripple = button.querySelector('.ripple-effect');
            expect(ripple).toBeTruthy();
        });
    });

    describe('ApiService', () => {
        let apiService;

        beforeEach(() => {
            apiService = new ApiService();
            fetch.mockClear();
        });

        test('should make GET request', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: 'test' })
            });

            const result = await apiService.request('/test');
            
            expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
                headers: expect.objectContaining({
                    'Content-Type': 'application/json'
                })
            }));
            expect(result.success).toBe(true);
        });

        test('should handle authentication token', () => {
            apiService.setToken('test-token');
            
            expect(apiService.token).toBe('test-token');
            expect(localStorage.getItem('authToken')).toBe('test-token');
        });

        test('should retry on network failure', async () => {
            // Mock network failure then success
            fetch
                .mockRejectedValueOnce(new TypeError('Network error'))
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ success: true })
                });

            const result = await apiService.request('/test');
            
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(result.success).toBe(true);
        });

        test('should handle 401 unauthorized', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ message: 'Unauthorized' })
            });

            await expect(apiService.request('/test')).rejects.toThrow('Unauthorized');
            expect(apiService.token).toBe(null);
        });
    });

    describe('PerformanceOptimizer', () => {
        let performanceOptimizer;

        beforeEach(() => {
            performanceOptimizer = new PerformanceOptimizer();
        });

        test('should cache data', () => {
            const testData = { test: 'data' };
            performanceOptimizer.setCache('test-key', testData);
            
            const cached = performanceOptimizer.getCache('test-key');
            expect(cached).toEqual(testData);
        });

        test('should expire cached data', (done) => {
            const testData = { test: 'data' };
            performanceOptimizer.setCache('test-key', testData, 100); // 100ms TTL
            
            setTimeout(() => {
                const cached = performanceOptimizer.getCache('test-key');
                expect(cached).toBe(null);
                done();
            }, 150);
        });

        test('should throttle function calls', (done) => {
            let callCount = 0;
            const throttledFn = performanceOptimizer.throttle(() => {
                callCount++;
            }, 100);

            // Call function multiple times quickly
            throttledFn();
            throttledFn();
            throttledFn();

            expect(callCount).toBe(1);

            setTimeout(() => {
                throttledFn();
                expect(callCount).toBe(2);
                done();
            }, 150);
        });

        test('should debounce function calls', (done) => {
            let callCount = 0;
            const debouncedFn = performanceOptimizer.debounce(() => {
                callCount++;
            }, 100);

            // Call function multiple times quickly
            debouncedFn();
            debouncedFn();
            debouncedFn();

            expect(callCount).toBe(0);

            setTimeout(() => {
                expect(callCount).toBe(1);
                done();
            }, 150);
        });
    });
});