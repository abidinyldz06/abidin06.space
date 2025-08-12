const jwt = require('jsonwebtoken');

// JWT Secret - Production'da environment variable olmalı
const JWT_SECRET = process.env.JWT_SECRET || 'abidin-space-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// JWT Token oluşturma
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'abidin.space',
        audience: 'abidin.space-users'
    });
};

// JWT Token doğrulama middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Access token gerekli' 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false,
                    message: 'Token süresi dolmuş',
                    code: 'TOKEN_EXPIRED'
                });
            } else if (err.name === 'JsonWebTokenError') {
                return res.status(403).json({ 
                    success: false,
                    message: 'Geçersiz token',
                    code: 'INVALID_TOKEN'
                });
            } else {
                return res.status(403).json({ 
                    success: false,
                    message: 'Token doğrulama hatası',
                    code: 'TOKEN_ERROR'
                });
            }
        }

        // Token geçerli, kullanıcı bilgilerini request'e ekle
        req.user = decoded;
        next();
    });
};

// Token yenileme middleware
const refreshToken = (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ 
            success: false,
            message: 'Refresh token gerekli' 
        });
    }

    jwt.verify(refreshToken, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ 
                success: false,
                message: 'Geçersiz refresh token' 
            });
        }

        // Yeni token oluştur
        const newToken = generateToken({
            id: decoded.id,
            username: decoded.username,
            email: decoded.email
        });

        req.newToken = newToken;
        req.user = decoded;
        next();
    });
};

// Optional authentication - token varsa doğrula, yoksa devam et
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (!err) {
            req.user = decoded;
        }
        next();
    });
};

// Rate limiting için kullanıcı ID'si al
const getUserId = (req) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.id;
    } catch (err) {
        return null;
    }
};

module.exports = {
    generateToken,
    authenticateToken,
    refreshToken,
    optionalAuth,
    getUserId,
    JWT_SECRET
};