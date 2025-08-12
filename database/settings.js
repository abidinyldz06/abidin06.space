const { db } = require('./init');

// Get user settings
const getUserSettings = (userId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT theme, font_size, notifications, sound_notifications, 
                   save_history, language, auto_scroll, show_timestamps, 
                   compact_mode, created_at, updated_at
            FROM user_settings 
            WHERE user_id = ?
        `;
        
        db.get(query, [userId], (err, row) => {
            if (err) {
                reject(err);
            } else if (row) {
                resolve({
                    theme: row.theme,
                    fontSize: row.font_size,
                    notifications: Boolean(row.notifications),
                    soundNotifications: Boolean(row.sound_notifications),
                    saveHistory: Boolean(row.save_history),
                    language: row.language,
                    autoScroll: Boolean(row.auto_scroll),
                    showTimestamps: Boolean(row.show_timestamps),
                    compactMode: Boolean(row.compact_mode),
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                });
            } else {
                // Return default settings if none exist
                resolve({
                    theme: 'dark',
                    fontSize: 'medium',
                    notifications: true,
                    soundNotifications: false,
                    saveHistory: true,
                    language: 'tr',
                    autoScroll: true,
                    showTimestamps: true,
                    compactMode: false
                });
            }
        });
    });
};

// Create or update user settings
const upsertUserSettings = (userId, settings) => {
    return new Promise((resolve, reject) => {
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
        } = settings;

        const query = `
            INSERT OR REPLACE INTO user_settings (
                user_id, theme, font_size, notifications, sound_notifications,
                save_history, language, auto_scroll, show_timestamps, compact_mode,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        
        db.run(query, [
            userId,
            theme || 'dark',
            fontSize || 'medium',
            notifications !== undefined ? (notifications ? 1 : 0) : 1,
            soundNotifications !== undefined ? (soundNotifications ? 1 : 0) : 0,
            saveHistory !== undefined ? (saveHistory ? 1 : 0) : 1,
            language || 'tr',
            autoScroll !== undefined ? (autoScroll ? 1 : 0) : 1,
            showTimestamps !== undefined ? (showTimestamps ? 1 : 0) : 1,
            compactMode !== undefined ? (compactMode ? 1 : 0) : 0
        ], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
};

// Reset user settings to default
const resetUserSettings = (userId) => {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT OR REPLACE INTO user_settings (
                user_id, theme, font_size, notifications, sound_notifications,
                save_history, language, auto_scroll, show_timestamps, compact_mode,
                updated_at
            ) VALUES (?, 'dark', 'medium', 1, 0, 1, 'tr', 1, 1, 0, CURRENT_TIMESTAMP)
        `;
        
        db.run(query, [userId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
};

// Delete user settings
const deleteUserSettings = (userId) => {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM user_settings WHERE user_id = ?`;
        
        db.run(query, [userId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
};

module.exports = {
    getUserSettings,
    upsertUserSettings,
    resetUserSettings,
    deleteUserSettings
};