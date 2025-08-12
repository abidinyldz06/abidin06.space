const { db } = require('./init');

// Log user activity
const logActivity = (activityData) => {
    return new Promise((resolve, reject) => {
        const { userId, activityType, data, ipAddress, userAgent } = activityData;
        
        const query = `
            INSERT INTO user_activity (user_id, activity_type, activity_data, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        db.run(query, [
            userId,
            activityType,
            data ? JSON.stringify(data) : null,
            ipAddress,
            userAgent
        ], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    id: this.lastID,
                    userId,
                    activityType,
                    data,
                    ipAddress,
                    userAgent,
                    createdAt: new Date().toISOString()
                });
            }
        });
    });
};

// Get user activity history
const getUserActivity = (userId, options = {}) => {
    return new Promise((resolve, reject) => {
        const { page = 1, limit = 50, activityType } = options;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT activity_type, activity_data, ip_address, user_agent, created_at
            FROM user_activity 
            WHERE user_id = ?
        `;
        
        const params = [userId];
        
        if (activityType) {
            query += ` AND activity_type = ?`;
            params.push(activityType);
        }
        
        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const activities = rows.map(row => ({
                    activityType: row.activity_type,
                    data: row.activity_data ? JSON.parse(row.activity_data) : null,
                    ipAddress: row.ip_address,
                    userAgent: row.user_agent,
                    createdAt: row.created_at
                }));
                resolve(activities);
            }
        });
    });
};

// Get activity statistics
const getActivityStats = (userId, days = 30) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                activity_type,
                COUNT(*) as count,
                DATE(created_at) as date
            FROM user_activity 
            WHERE user_id = ? 
            AND created_at >= DATE('now', '-${days} days')
            GROUP BY activity_type, DATE(created_at)
            ORDER BY created_at DESC
        `;
        
        db.all(query, [userId], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Clean old activity logs (keep only last 90 days)
const cleanOldActivity = (days = 90) => {
    return new Promise((resolve, reject) => {
        const query = `
            DELETE FROM user_activity 
            WHERE created_at < DATE('now', '-${days} days')
        `;
        
        db.run(query, [], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
};

// Delete all activity for a user
const deleteUserActivity = (userId) => {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM user_activity WHERE user_id = ?`;
        
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
    logActivity,
    getUserActivity,
    getActivityStats,
    cleanOldActivity,
    deleteUserActivity
};