const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user settings
router.get('/', authenticateToken, async (req, res) => {
    try {
        // In a real implementation, you'd have a settings table
        // For now, return default settings
        const defaultSettings = {
            theme: 'dark',
            fontSize: 'medium',
            notifications: true,
            soundNotifications: false,
            saveHistory: true,
            language: 'tr',
            autoScroll: true,
            showTimestamps: true,
            compactMode: false
        };

        res.json({
            success: true,
            settings: defaultSettings
        });

    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Ayarlar alınamadı'
        });
    }
});

// Update user settings
router.put('/', authenticateToken, async (req, res) => {
    try {
        const {
            theme,
            fontSize,
            notifications,
            soundNotifications,
            saveHistory,
            language,
            autoScroll,
            showTimestamps,
            compactMode
        } = req.body;

        // Validate settings
        const validThemes = ['light', 'dark'];
        const validFontSizes = ['small', 'medium', 'large'];
        const validLanguages = ['tr', 'en'];

        if (theme && !validThemes.includes(theme)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz tema seçimi'
            });
        }

        if (fontSize && !validFontSizes.includes(fontSize)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz yazı boyutu seçimi'
            });
        }

        if (language && !validLanguages.includes(language)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz dil seçimi'
            });
        }

        // In a real implementation, you'd save these to a database
        const updatedSettings = {
            theme: theme || 'dark',
            fontSize: fontSize || 'medium',
            notifications: notifications !== undefined ? notifications : true,
            soundNotifications: soundNotifications !== undefined ? soundNotifications : false,
            saveHistory: saveHistory !== undefined ? saveHistory : true,
            language: language || 'tr',
            autoScroll: autoScroll !== undefined ? autoScroll : true,
            showTimestamps: showTimestamps !== undefined ? showTimestamps : true,
            compactMode: compactMode !== undefined ? compactMode : false
        };

        res.json({
            success: true,
            message: 'Ayarlar başarıyla güncellendi',
            settings: updatedSettings
        });

    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Ayarlar güncellenemedi'
        });
    }
});

// Reset settings to default
router.post('/reset', authenticateToken, async (req, res) => {
    try {
        const defaultSettings = {
            theme: 'dark',
            fontSize: 'medium',
            notifications: true,
            soundNotifications: false,
            saveHistory: true,
            language: 'tr',
            autoScroll: true,
            showTimestamps: true,
            compactMode: false
        };

        // In a real implementation, you'd reset the user's settings in the database

        res.json({
            success: true,
            message: 'Ayarlar varsayılan değerlere sıfırlandı',
            settings: defaultSettings
        });

    } catch (error) {
        console.error('Reset settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Ayarlar sıfırlanamadı'
        });
    }
});

// Export user settings
router.get('/export', authenticateToken, async (req, res) => {
    try {
        // Get user settings (in a real implementation, from database)
        const settings = {
            theme: 'dark',
            fontSize: 'medium',
            notifications: true,
            soundNotifications: false,
            saveHistory: true,
            language: 'tr',
            autoScroll: true,
            showTimestamps: true,
            compactMode: false
        };

        const exportData = {
            user: req.user.username,
            exportDate: new Date().toISOString(),
            settings
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="settings-${req.user.username}-${new Date().toISOString().split('T')[0]}.json"`);
        res.json(exportData);

    } catch (error) {
        console.error('Export settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Ayarlar dışa aktarılamadı'
        });
    }
});

// Import user settings
router.post('/import', authenticateToken, async (req, res) => {
    try {
        const { settings } = req.body;

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Geçerli ayar verisi gerekli'
            });
        }

        // Validate imported settings
        const validThemes = ['light', 'dark'];
        const validFontSizes = ['small', 'medium', 'large'];
        const validLanguages = ['tr', 'en'];

        if (settings.theme && !validThemes.includes(settings.theme)) {
            return res.status(400).json({
                success: false,
                message: 'İçe aktarılan ayarlarda geçersiz tema'
            });
        }

        if (settings.fontSize && !validFontSizes.includes(settings.fontSize)) {
            return res.status(400).json({
                success: false,
                message: 'İçe aktarılan ayarlarda geçersiz yazı boyutu'
            });
        }

        if (settings.language && !validLanguages.includes(settings.language)) {
            return res.status(400).json({
                success: false,
                message: 'İçe aktarılan ayarlarda geçersiz dil'
            });
        }

        // In a real implementation, you'd save these to the database

        res.json({
            success: true,
            message: 'Ayarlar başarıyla içe aktarıldı',
            settings
        });

    } catch (error) {
        console.error('Import settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Ayarlar içe aktarılamadı'
        });
    }
});

module.exports = router;