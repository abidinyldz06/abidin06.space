const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Input sanitization
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
};

// Sanitize request body recursively
const sanitizeBody = (obj) => {
    if (typeof obj === 'string') {
        return sanitizeInput(obj);
    } else if (Array.isArray(obj)) {
        return obj.map(sanitizeBody);
    } else if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[sanitizeInput(key)] = sanitizeBody(value);
        }
        return sanitized;
    }
    return obj;
};

// Input sanitization middleware
const sanitizeInputs = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeBody(req.body);
    }
    
    if (req.query) {
        req.query = sanitizeBody(req.query);
    }
    
    if (req.params) {
        req.params = sanitizeBody(req.params);
    }
    
    next();
};

// CSRF Protection middleware
const csrfProtection = (req, res, next) => {
    // Skip CSRF for GET requests and API endpoints with valid JWT
    if (req.method === 'GET' || req.headers.authorization) {
        return next();
    }

    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionToken = req.session?.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
        return res.status(403).json({
            success: false,
            message: 'CSRF token mismatch',
            code: 'CSRF_ERROR'
        });
    }

    next();
};

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message,
            code: 'RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                message,
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.round(windowMs / 1000)
            });
        }
    });
};

// Different rate limits for different endpoints
const rateLimits = {
    // General API rate limit
    general: createRateLimit(
        15 * 60 * 1000, // 15 minutes
        100, // 100 requests per window
        'Çok fazla istek. 15 dakika sonra tekrar deneyin.'
    ),
    
    // Strict rate limit for authentication
    auth: createRateLimit(
        15 * 60 * 1000, // 15 minutes
        5, // 5 attempts per window
        'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.'
    ),
    
    // Chat message rate limit
    chat: createRateLimit(
        1 * 60 * 1000, // 1 minute
        30, // 30 messages per minute
        'Çok fazla mesaj gönderiyorsunuz. Lütfen biraz bekleyin.'
    ),
    
    // File upload rate limit
    upload: createRateLimit(
        60 * 60 * 1000, // 1 hour
        10, // 10 uploads per hour
        'Çok fazla dosya yükleme. 1 saat sonra tekrar deneyin.'
    )
};

// Security headers configuration
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            workerSrc: ["'self'"],
            childSrc: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            manifestSrc: ["'self'"]
        },
    },
    crossOriginEmbedderPolicy: false, // Disable for development
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// IP-based security checks
const securityChecks = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    
    // Log suspicious activity
    if (!userAgent || userAgent.length < 10) {
        console.warn(`Suspicious request from ${clientIP}: Missing or short User-Agent`);
    }
    
    // Block common attack patterns
    const suspiciousPatterns = [
        /sqlmap/i,
        /nikto/i,
        /nmap/i,
        /masscan/i,
        /zap/i,
        /burp/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
        console.warn(`Blocked suspicious User-Agent from ${clientIP}: ${userAgent}`);
        return res.status(403).json({
            success: false,
            message: 'Access denied',
            code: 'SUSPICIOUS_ACTIVITY'
        });
    }
    
    next();
};

// Password strength validation
const validatePasswordStrength = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
        errors.push(`Şifre en az ${minLength} karakter olmalı`);
    }
    
    if (!hasUpperCase) {
        errors.push('Şifre en az bir büyük harf içermeli');
    }
    
    if (!hasLowerCase) {
        errors.push('Şifre en az bir küçük harf içermeli');
    }
    
    if (!hasNumbers) {
        errors.push('Şifre en az bir rakam içermeli');
    }
    
    if (!hasSpecialChar) {
        errors.push('Şifre en az bir özel karakter içermeli');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        score: [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length
    };
};

// File upload security
const validateFileUpload = (file) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'text/plain',
        'application/json'
    ];
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    const errors = [];
    
    if (!allowedTypes.includes(file.mimetype)) {
        errors.push('Desteklenmeyen dosya türü');
    }
    
    if (file.size > maxSize) {
        errors.push('Dosya boyutu çok büyük (maksimum 5MB)');
    }
    
    // Check for potentially dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (dangerousExtensions.includes(fileExtension)) {
        errors.push('Güvenlik nedeniyle bu dosya türü kabul edilmiyor');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// Session security
const sessionSecurity = {
    name: 'sessionId',
    secret: process.env.SESSION_SECRET || 'abidin-space-session-secret-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true, // Prevent XSS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict' // CSRF protection
    }
};

module.exports = {
    sanitizeInputs,
    csrfProtection,
    rateLimits,
    securityHeaders,
    securityChecks,
    validatePasswordStrength,
    validateFileUpload,
    sessionSecurity,
    sanitizeInput
};