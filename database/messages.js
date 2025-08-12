const { db } = require('./init');
const { v4: uuidv4 } = require('uuid');

// Save message
const saveMessage = (messageData) => {
    return new Promise((resolve, reject) => {
        const { userId, content, type, sessionId } = messageData;
        const query = `
            INSERT INTO messages (user_id, content, type, session_id)
            VALUES (?, ?, ?, ?)
        `;
        
        db.run(query, [userId, content, type, sessionId || null], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    id: this.lastID,
                    userId,
                    content,
                    type,
                    sessionId,
                    createdAt: new Date().toISOString()
                });
            }
        });
    });
};

// Get user messages with pagination
const getUserMessages = (userId, options = {}) => {
    return new Promise((resolve, reject) => {
        const { page = 1, limit = 50, sessionId } = options;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT id, content, type, created_at, session_id
            FROM messages 
            WHERE user_id = ?
        `;
        
        const params = [userId];
        
        if (sessionId) {
            query += ` AND session_id = ?`;
            params.push(sessionId);
        }
        
        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                // Reverse to get chronological order
                resolve(rows.reverse());
            }
        });
    });
};

// Get message by ID
const getMessageById = (messageId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT id, user_id, content, type, created_at, session_id
            FROM messages 
            WHERE id = ?
        `;
        
        db.get(query, [messageId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// Delete message
const deleteMessage = (messageId, userId) => {
    return new Promise((resolve, reject) => {
        const query = `
            DELETE FROM messages 
            WHERE id = ? AND user_id = ?
        `;
        
        db.run(query, [messageId, userId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
};

// Clear user messages
const clearUserMessages = (userId, sessionId = null) => {
    return new Promise((resolve, reject) => {
        let query = `DELETE FROM messages WHERE user_id = ?`;
        const params = [userId];
        
        if (sessionId) {
            query += ` AND session_id = ?`;
            params.push(sessionId);
        }
        
        db.run(query, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
};

// Get message statistics
const getMessageStats = (userId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                COUNT(*) as total_messages,
                COUNT(CASE WHEN type = 'user' THEN 1 END) as user_messages,
                COUNT(CASE WHEN type = 'assistant' THEN 1 END) as assistant_messages,
                COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today_messages,
                COUNT(CASE WHEN DATE(created_at) = DATE('now', '-1 day') THEN 1 END) as yesterday_messages,
                COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-7 days') THEN 1 END) as week_messages,
                MIN(created_at) as first_message,
                MAX(created_at) as last_message
            FROM messages 
            WHERE user_id = ?
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
                    yesterday_messages: 0,
                    week_messages: 0,
                    first_message: null,
                    last_message: null
                });
            }
        });
    });
};

// Create new session
const createSession = (userId) => {
    return new Promise((resolve, reject) => {
        const sessionId = uuidv4();
        const query = `
            INSERT INTO sessions (id, user_id)
            VALUES (?, ?)
        `;
        
        db.run(query, [sessionId, userId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    id: sessionId,
                    userId,
                    startTime: new Date().toISOString(),
                    messageCount: 0
                });
            }
        });
    });
};

// Update session message count
const updateSessionMessageCount = (sessionId) => {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE sessions 
            SET message_count = (
                SELECT COUNT(*) FROM messages WHERE session_id = ?
            )
            WHERE id = ?
        `;
        
        db.run(query, [sessionId, sessionId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
};

// End session
const endSession = (sessionId) => {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE sessions 
            SET end_time = CURRENT_TIMESTAMP,
                message_count = (
                    SELECT COUNT(*) FROM messages WHERE session_id = ?
                )
            WHERE id = ?
        `;
        
        db.run(query, [sessionId, sessionId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
};

// Get user sessions
const getUserSessions = (userId, options = {}) => {
    return new Promise((resolve, reject) => {
        const { page = 1, limit = 20 } = options;
        const offset = (page - 1) * limit;
        
        const query = `
            SELECT id, start_time, end_time, message_count
            FROM sessions 
            WHERE user_id = ?
            ORDER BY start_time DESC 
            LIMIT ? OFFSET ?
        `;
        
        db.all(query, [userId, limit, offset], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

module.exports = {
    saveMessage,
    getUserMessages,
    getMessageById,
    deleteMessage,
    clearUserMessages,
    getMessageStats,
    createSession,
    updateSessionMessageCount,
    endSession,
    getUserSessions
};