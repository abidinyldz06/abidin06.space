const express = require('express');
const bcrypt = require('bcryptjs');
const { generateToken, authenticateToken, refreshToken } = require('../middleware/auth');
const { getUser, createUser, updateUserLastLogin } = require('../database/users');
const { rateLimits, validatePasswordStrength } = require('../middleware/security');
const { logActivity } = require('../database/activity');

const router = express.Router();

// Validation helper
const validateInput = (username, password) => {
    const errors = [];

    if (!username || username.trim().length < 3) {
        errors.push('Kullanıcı adı en az 3 karakter olmalı');
    }

    if (!password || password.length < 6) {
        errors.push('Şifre en az 6 karakter olmalı');
    }

    if (username && !/^[a-zA-Z0-9_]+$/.test(username.trim())) {
        errors.push('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir');
    }

    return errors;
};

// Login endpoint
router.post('/login', rateLimits.auth, async (req, res) => {
    try {
        const { username, password, remember } = req.body;

        // Input validation
        const validationErrors = validateInput(username, password);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: validationErrors[0],
                errors: validationErrors
            });
        }

        // Get user from database
        const user = await getUser(username.trim().toLowerCase());
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Kullanıcı adı veya şifre hatalı'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            // Log failed login attempt
            await logActivity({
                userId: user.id,
                activityType: 'login_failed',
                data: { reason: 'invalid_password' },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            return res.status(401).json({
                success: false,
                message: 'Kullanıcı adı veya şifre hatalı'
            });
        }

        // Log successful login
        await logActivity({
            userId: user.id,
            activityType: 'login',
            data: { success: true },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        // Update last login
        await updateUserLastLogin(user.id);

        // Generate JWT token
        const tokenPayload = {
            id: user.id,
            username: user.username,
            email: user.email
        };

        const token = generateToken(tokenPayload);

        // Return success response
        res.json({
            success: true,
            message: 'Giriş başarılı',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.created_at,
                lastLogin: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası. Lütfen tekrar deneyin.'
        });
    }
});

// Register endpoint (for demo purposes)
router.post('/register', rateLimits.auth, async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Input validation
        const validationErrors = validateInput(username, password);
        
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            validationErrors.push('Geçerli bir email adresi girin');
        }

        // Password strength validation
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            validationErrors.push(...passwordValidation.errors);
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: validationErrors[0],
                errors: validationErrors
            });
        }

        // Check if user already exists
        const existingUser = await getUser(username.trim().toLowerCase());
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Bu kullanıcı adı zaten kullanılıyor'
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const newUser = await createUser({
            username: username.trim().toLowerCase(),
            email: email.trim().toLowerCase(),
            password: hashedPassword
        });

        // Generate JWT token
        const tokenPayload = {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email
        };

        const token = generateToken(tokenPayload);

        // Return success response
        res.status(201).json({
            success: true,
            message: 'Kayıt başarılı',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                createdAt: newUser.created_at
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası. Lütfen tekrar deneyin.'
        });
    }
});

// Token validation endpoint
router.get('/validate', authenticateToken, async (req, res) => {
    try {
        // Get fresh user data
        const user = await getUser(req.user.username);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.created_at,
                lastLogin: user.last_login
            }
        });

    } catch (error) {
        console.error('Token validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Token doğrulama hatası'
        });
    }
});

// Token refresh endpoint
router.post('/refresh', refreshToken, (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Token yenilendi',
            token: req.newToken,
            user: {
                id: req.user.id,
                username: req.user.username,
                email: req.user.email
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Token yenileme hatası'
        });
    }
});

// Logout endpoint (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
    // In a more complex setup, you might want to blacklist the token
    res.json({
        success: true,
        message: 'Çıkış başarılı'
    });
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await getUser(req.user.username);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.created_at,
                lastLogin: user.last_login
            }
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Profil bilgileri alınamadı'
        });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { email } = req.body;
        const userId = req.user.id;

        // Validate email
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Geçerli bir email adresi girin'
            });
        }

        // Update user profile
        const { updateUserProfile } = require('../database/users');
        const updatedRows = await updateUserProfile(userId, { email });

        if (updatedRows === 0) {
            return res.status(400).json({
                success: false,
                message: 'Güncellenecek bilgi bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Profil başarıyla güncellendi'
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Profil güncellenemedi'
        });
    }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mevcut şifre ve yeni şifre gerekli'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Yeni şifre en az 6 karakter olmalı'
            });
        }

        // Get user and verify current password
        const user = await getUser(req.user.username);
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Mevcut şifre hatalı'
            });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        const { updateUserPassword } = require('../database/users');
        await updateUserPassword(userId, hashedNewPassword);

        res.json({
            success: true,
            message: 'Şifre başarıyla değiştirildi'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Şifre değiştirilemedi'
        });
    }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const { getUserStats } = require('../database/users');
        const stats = await getUserStats(req.user.id);

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('User stats error:', error);
        res.status(500).json({
            success: false,
            message: 'İstatistikler alınamadı'
        });
    }
});

// Delete user account
router.delete('/account', authenticateToken, async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;

        // Verify password before deletion
        const user = await getUser(req.user.username);
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Şifre hatalı'
            });
        }

        // Deactivate user (soft delete)
        const { deactivateUser } = require('../database/users');
        await deactivateUser(userId);

        res.json({
            success: true,
            message: 'Hesap başarıyla silindi'
        });

    } catch (error) {
        console.error('Account deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Hesap silinemedi'
        });
    }
});

module.exports = router;