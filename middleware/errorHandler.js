const { logActivity } = require('../database/activity');

// Custom error classes
class AppError extends Error {
    constructor(message, statusCode, code = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, errors = []) {
        super(message, 400, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND_ERROR');
    }
}

class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429, 'RATE_LIMIT_ERROR');
    }
}

class DatabaseError extends AppError {
    constructor(message = 'Database operation failed') {
        super(message, 500, 'DATABASE_ERROR');
    }
}

// Error logging utility
const logError = async (error, req = null, additionalInfo = {}) => {
    const errorLog = {
        message: error.message,
        stack: error.stack,
        statusCode: error.statusCode || 500,
        code: error.code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
        ...additionalInfo
    };

    if (req) {
        errorLog.url = req.originalUrl;
        errorLog.method = req.method;
        errorLog.ip = req.ip;
        errorLog.userAgent = req.get('User-Agent');
        errorLog.userId = req.user?.id;
    }

    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
        console.error('Error:', errorLog);
    }

    // Log to database if user is available
    if (req?.user?.id) {
        try {
            await logActivity({
                userId: req.user.id,
                activityType: 'error',
                data: errorLog,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
        } catch (logErr) {
            console.error('Failed to log error to database:', logErr);
        }
    }

    // In production, you might want to send to external logging service
    // Example: Sentry, LogRocket, etc.
};

// Development error response
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        success: false,
        error: {
            message: err.message,
            code: err.code,
            statusCode: err.statusCode,
            stack: err.stack,
            errors: err.errors || []
        }
    });
};

// Production error response
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            code: err.code,
            errors: err.errors || []
        });
    } else {
        // Programming or other unknown error: don't leak error details
        console.error('ERROR:', err);
        
        res.status(500).json({
            success: false,
            message: 'Bir şeyler yanlış gitti. Lütfen tekrar deneyin.',
            code: 'INTERNAL_SERVER_ERROR'
        });
    }
};

// Handle specific error types
const handleCastErrorDB = (err) => {
    const message = `Geçersiz ${err.path}: ${err.value}`;
    return new ValidationError(message);
};

const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Bu ${value} zaten kullanılıyor. Lütfen başka bir değer deneyin.`;
    return new ValidationError(message);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Geçersiz veri girişi: ${errors.join('. ')}`;
    return new ValidationError(message, errors);
};

const handleJWTError = () => {
    return new AuthenticationError('Geçersiz token. Lütfen tekrar giriş yapın.');
};

const handleJWTExpiredError = () => {
    return new AuthenticationError('Token süresi dolmuş. Lütfen tekrar giriş yapın.');
};

// Main error handling middleware
const globalErrorHandler = async (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log the error
    await logError(err, req);

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        let error = { ...err };
        error.message = err.message;

        // Handle specific error types
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
};

// Async error wrapper
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

// 404 handler
const notFoundHandler = (req, res, next) => {
    const err = new NotFoundError(`Can't find ${req.originalUrl} on this server!`);
    next(err);
};

// Unhandled promise rejection handler
const handleUnhandledRejection = () => {
    process.on('unhandledRejection', (err, promise) => {
        console.log('UNHANDLED PROMISE REJECTION! 💥 Shutting down...');
        console.log(err.name, err.message);
        
        // Close server gracefully
        process.exit(1);
    });
};

// Uncaught exception handler
const handleUncaughtException = () => {
    process.on('uncaughtException', (err) => {
        console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
        console.log(err.name, err.message);
        process.exit(1);
    });
};

// Graceful shutdown handler
const handleGracefulShutdown = (server) => {
    const shutdown = (signal) => {
        console.log(`${signal} received. Shutting down gracefully...`);
        
        server.close(() => {
            console.log('Process terminated');
            process.exit(0);
        });

        // Force close after 10 seconds
        setTimeout(() => {
            console.log('Forcing shutdown...');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    RateLimitError,
    DatabaseError,
    globalErrorHandler,
    catchAsync,
    notFoundHandler,
    handleUnhandledRejection,
    handleUncaughtException,
    handleGracefulShutdown,
    logError
};