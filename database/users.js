const { db } = require('./init');

// Get user by username or email
const getUser = (identifier) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT id, username, email, password, created_at, last_login, is_active
            FROM users 
            WHERE (username = ? OR email = ?) AND is_active = 1
        `;
        
        db.get(query, [identifier, identifier], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// Get user by ID
const getUserById = (id) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT id, username, email, created_at, last_login, is_active
            FROM users 
            WHERE id = ? AND is_active = 1
        `;
        
        db.get(query, [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// Create new user
const createUser = (userData) => {
    return new Promise((resolve, reject) => {
        const { username, email, password } = userData;
        const query = `
            INSERT INTO users (username, email, password)
            VALUES (?, ?, ?)
        `;
        
        db.run(query, [username, email, password], function(err) {
            if (err) {
                reject(err);
            } else {
                // Return the created user
                getUserById(this.lastID)
                    .then(user => resolve(user))
                    .catch(err => reject(err));
            }
        });
    });
};

// Update user last login
const updateUserLastLogin = (userId) => {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE users 
            SET last_login = CURRENT_TIMESTAMP 
            WHERE id = ?
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

// Update user profile
const updateUserProfile = (userId, updates) => {
    return new Promise((resolve, reject) => {
        const allowedFields = ['email'];
        const fields = [];
        const values = [];
        
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }
        
        if (fields.length === 0) {
            resolve(0);
            return;
        }
        
        values.push(userId);
        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        
        db.run(query, values, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
};

// Update user password
const updateUserPassword = (userId, hashedPassword) => {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE users 
            SET password = ? 
            WHERE id = ?
        `;
        
        db.run(query, [hashedPassword, userId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
};

// Deactivate user (soft delete)
const deactivateUser = (userId) => {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE users 
            SET is_active = 0 
            WHERE id = ?
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

// Get user statistics
const getUserStats = (userId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                COUNT(m.id) as total_messages,
                COUNT(CASE WHEN m.type = 'user' THEN 1 END) as user_messages,
                COUNT(CASE WHEN m.type = 'assistant' THEN 1 END) as assistant_messages,
                COUNT(CASE WHEN DATE(m.created_at) = DATE('now') THEN 1 END) as today_messages,
                MIN(m.created_at) as first_message,
                MAX(m.created_at) as last_message
            FROM users u
            LEFT JOIN messages m ON u.id = m.user_id
            WHERE u.id = ?
            GROUP BY u.id
        `;
        
        db.get(query, [userId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row || {
                    total_messages: 0,
                    user_messages: 0,
                    assistant_messages: 0,
                    today_messages: 0,
                    first_message: null,
                    last_message: null
                });
            }
        });
    });
};

module.exports = {
    getUser,
    getUserById,
    createUser,
    updateUserLastLogin,
    updateUserProfile,
    updateUserPassword,
    deactivateUser,
    getUserStats
};