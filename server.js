const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const { initializeDatabase } = require('./database/init');
const { 
    sanitizeInputs, 
    securityHeaders, 
    securityChecks, 
    rateLimits,
    sessionSecurity
} = require('./middleware/security');
const {
    globalErrorHandler,
    notFoundHandler,
    handleUnhandledRejection,
    handleUncaughtException,
    handleGracefulShutdown
} = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security headers
app.use(securityHeaders);

// Security checks
app.use(securityChecks);

// General rate limiting
app.use(rateLimits.general);

// Session configuration
app.use(session(sessionSecurity));

// CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 'https://abidin.space' : 'http://localhost:3000',
    credentials: true
}));

// Body parsing middleware with performance optimizations
app.use(express.json({ 
    limit: '1mb',
    type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '1mb',
    parameterLimit: 100 // Limit number of parameters
}));

// Input sanitization
app.use(sanitizeInputs);

// Compression middleware for better performance
const compression = require('compression');
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6, // Good balance between compression and CPU usage
    threshold: 1024 // Only compress responses larger than 1KB
}));

// Serve static files with caching and performance optimizations
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0', // Cache for 1 year in production
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        // Set specific cache headers for different file types
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (path.endsWith('.js') || path.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (path.match(/\.(jpg|jpeg|png|gif|ico|svg|webp)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
        
        // Enable gzip for text files
        if (path.match(/\.(js|css|html|json|xml|txt)$/)) {
            res.setHeader('Content-Encoding', 'gzip');
        }
    }
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
    });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/settings', require('./routes/settings'));

// Catch all handler: send back index.html file for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler for API routes
app.use('/api/*', notFoundHandler);

// Global error handling middleware
app.use(globalErrorHandler);

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException();
handleUnhandledRejection();

// Initialize database and start server
const startServer = async () => {
    try {
        await initializeDatabase();
        
        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Visit: http://localhost:${PORT}`);
            console.log('Database initialized successfully');
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });

        // Handle graceful shutdown
        handleGracefulShutdown(server);
        
        return server;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;