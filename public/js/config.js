// Configuration for GitHub Pages deployment
window.APP_CONFIG = {
    // Environment
    environment: 'production',
    isGitHubPages: true,
    
    // API Configuration
    apiMode: 'static', // 'static' for GitHub Pages, 'server' for full backend
    baseURL: window.location.origin,
    
    // Features
    features: {
        authentication: true,
        chat: true,
        dashboard: true,
        settings: true,
        fileUpload: true,
        notifications: true
    },
    
    // UI Configuration
    ui: {
        theme: 'dark',
        animations: true,
        sounds: false, // Disabled for static deployment
        autoSave: true
    },
    
    // Performance
    performance: {
        lazyLoading: true,
        virtualScrolling: true,
        caching: true,
        preloading: true
    },
    
    // Demo Data
    demo: {
        enabled: true,
        autoLogin: false, // Set to true for demo purposes
        demoUser: {
            username: 'demo',
            password: 'demo123'
        }
    },
    
    // GitHub Pages specific
    githubPages: {
        repository: 'abidin06.space',
        owner: 'abidinyldz06',
        branch: 'main',
        customDomain: 'abidin06.space'
    },
    
    // Analytics (can be added later)
    analytics: {
        enabled: false,
        googleAnalytics: null,
        hotjar: null
    },
    
    // Social Links
    social: {
        github: 'https://github.com/abidinyldz06',
        website: 'https://abidin06.space',
        email: 'contact@abidin06.space'
    }
};

// Initialize app configuration
console.log('🚀 Abidin.Space - GitHub Pages Mode Activated');
console.log('📊 Configuration loaded:', window.APP_CONFIG);