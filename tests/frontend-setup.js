// Frontend-specific test setup
require('jsdom-global')();

// Mock browser APIs
global.IntersectionObserver = class IntersectionObserver {
    constructor(callback, options) {
        this.callback = callback;
        this.options = options;
    }
    
    observe() {}
    unobserve() {}
    disconnect() {}
};

global.ResizeObserver = class ResizeObserver {
    constructor(callback) {
        this.callback = callback;
    }
    
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock performance API
global.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    memory: {
        usedJSHeapSize: 1000000,
        jsHeapSizeLimit: 10000000
    }
};

// Mock requestIdleCallback
global.requestIdleCallback = jest.fn((callback) => {
    setTimeout(() => callback({ timeRemaining: () => 50 }), 0);
});

global.cancelIdleCallback = jest.fn();

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
    setTimeout(callback, 16);
});

global.cancelAnimationFrame = jest.fn();

// Mock CSS.supports
global.CSS = {
    supports: jest.fn(() => true)
};

// Mock navigator
Object.defineProperty(global.navigator, 'onLine', {
    writable: true,
    value: true
});

Object.defineProperty(global.navigator, 'userAgent', {
    writable: true,
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
});

// Mock window methods
global.alert = jest.fn();
global.confirm = jest.fn(() => true);
global.prompt = jest.fn();

// Mock URL and Blob for file operations
global.URL = {
    createObjectURL: jest.fn(() => 'blob:mock-url'),
    revokeObjectURL: jest.fn()
};

global.Blob = class Blob {
    constructor(parts, options) {
        this.parts = parts;
        this.options = options;
        this.size = parts.reduce((size, part) => size + part.length, 0);
        this.type = options?.type || '';
    }
};

// Mock File API
global.File = class File extends Blob {
    constructor(parts, name, options) {
        super(parts, options);
        this.name = name;
        this.lastModified = Date.now();
    }
};

global.FileReader = class FileReader {
    constructor() {
        this.readyState = 0;
        this.result = null;
        this.error = null;
    }
    
    readAsText(file) {
        setTimeout(() => {
            this.readyState = 2;
            this.result = file.parts ? file.parts.join('') : '';
            if (this.onload) this.onload();
        }, 0);
    }
    
    readAsDataURL(file) {
        setTimeout(() => {
            this.readyState = 2;
            this.result = 'data:text/plain;base64,dGVzdA==';
            if (this.onload) this.onload();
        }, 0);
    }
};

// Mock WebSocket
global.WebSocket = class WebSocket {
    constructor(url) {
        this.url = url;
        this.readyState = 1; // OPEN
        setTimeout(() => {
            if (this.onopen) this.onopen();
        }, 0);
    }
    
    send(data) {
        // Mock send
    }
    
    close() {
        this.readyState = 3; // CLOSED
        if (this.onclose) this.onclose();
    }
};

// Mock crypto for UUID generation
global.crypto = {
    getRandomValues: jest.fn((arr) => {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
    })
};

// Mock matchMedia
global.matchMedia = jest.fn((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
}));

// Mock getComputedStyle
global.getComputedStyle = jest.fn(() => ({
    getPropertyValue: jest.fn(() => ''),
    setProperty: jest.fn()
}));

// Helper to trigger DOM events
global.triggerEvent = (element, eventType, eventInit = {}) => {
    const event = new Event(eventType, eventInit);
    element.dispatchEvent(event);
    return event;
};

// Helper to wait for DOM updates
global.waitForDOM = () => new Promise(resolve => setTimeout(resolve, 0));