const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Database file path
const DB_PATH = path.join(__dirname, 'abidin_space.db');

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Initialize database tables
const initializeDatabase = async () => {
    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            // Create users table
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME,
                    is_active BOOLEAN DEFAULT 1
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating users table:', err);
                }
            });

            // Create messages table
            db.run(`
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    type TEXT NOT NULL CHECK (type IN ('user', 'assistant')),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    session_id TEXT,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating messages table:', err);
                }
            });

            // Create sessions table
            db.run(`
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                    end_time DATETIME,
                    message_count INTEGER DEFAULT 0,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating sessions table:', err);
                }
            });

            // Create user_settings table
            db.run(`
                CREATE TABLE IF NOT EXISTS user_settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL UNIQUE,
                    theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
                    font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
                    notifications BOOLEAN DEFAULT 1,
                    sound_notifications BOOLEAN DEFAULT 0,
                    save_history BOOLEAN DEFAULT 1,
                    language TEXT DEFAULT 'tr' CHECK (language IN ('tr', 'en')),
                    auto_scroll BOOLEAN DEFAULT 1,
                    show_timestamps BOOLEAN DEFAULT 1,
                    compact_mode BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating user_settings table:', err);
                }
            });

            // Create message_reactions table
            db.run(`
                CREATE TABLE IF NOT EXISTS message_reactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    message_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike', 'love', 'laugh', 'sad', 'angry')),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    UNIQUE(message_id, user_id, reaction_type)
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating message_reactions table:', err);
                }
            });

            // Create user_activity table for tracking user actions
            db.run(`
                CREATE TABLE IF NOT EXISTS user_activity (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    activity_type TEXT NOT NULL,
                    activity_data TEXT, -- JSON data
                    ip_address TEXT,
                    user_agent TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating user_activity table:', err);
                }
            });

            // Create api_keys table for future API access
            db.run(`
                CREATE TABLE IF NOT EXISTS api_keys (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    key_name TEXT NOT NULL,
                    api_key TEXT NOT NULL UNIQUE,
                    permissions TEXT, -- JSON array of permissions
                    is_active BOOLEAN DEFAULT 1,
                    expires_at DATETIME,
                    last_used_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating api_keys table:', err);
                }
            });

            // Create indexes for better performance
            db.run(`CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_api_keys_api_key ON api_keys(api_key)`);

            // Create default admin user if not exists
            try {
                await createDefaultUser();
                console.log('Database initialization completed');
                resolve();
            } catch (error) {
                console.error('Error creating default user:', error);
                reject(error);
            }
        });
    });
};

// Create default user for testing
const createDefaultUser = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            // Check if admin user exists
            db.get('SELECT id FROM users WHERE username = ?', ['admin'], async (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!row) {
                    // Create admin user
                    const hashedPassword = await bcrypt.hash('admin123', 12);
                    
                    db.run(`
                        INSERT INTO users (username, email, password)
                        VALUES (?, ?, ?)
                    `, ['admin', 'admin@abidin.space', hashedPassword], function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            console.log('Default admin user created (username: admin, password: admin123)');
                            resolve();
                        }
                    });
                } else {
                    resolve();
                }
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Close database connection
const closeDatabase = () => {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) {
                reject(err);
            } else {
                console.log('Database connection closed');
                resolve();
            }
        });
    });
};

// Export database instance and functions
module.exports = {
    db,
    initializeDatabase,
    closeDatabase
};