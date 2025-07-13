import mysql from 'mysql2/promise';
import { config } from 'dotenv';

config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gammacraft_bot',
    port: parseInt(process.env.DB_PORT || '3306'),
    charset: 'utf8mb4',
    timezone: '+00:00'
};

let connection: mysql.Connection | null = null;

// Initialize database connection
export async function initializeDatabase(): Promise<void> {
    try {
        // Create connection
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL database successfully');

        // Create database if it doesn't exist - use query instead of execute for USE command
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
        await connection.query(`USE \`${dbConfig.database}\``);

        // Create tables
        await createTables();
        console.log('✅ Database tables initialized');

    } catch (error) {
        console.error('❌ Failed to connect to MySQL database:', error);
        console.log('🔧 Make sure MySQL is running and check your .env configuration');
        throw error;
    }
}

// Create all necessary tables
async function createTables(): Promise<void> {
    if (!connection) throw new Error('Database not connected');

    // User levels table
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS user_levels (
            id INT AUTO_INCREMENT PRIMARY KEY,
            guild_id VARCHAR(20) NOT NULL,
            user_id VARCHAR(20) NOT NULL,
            xp INT DEFAULT 0,
            level INT DEFAULT 1,
            messages INT DEFAULT 0,
            last_message BIGINT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_guild (guild_id, user_id),
            INDEX idx_guild_level (guild_id, level DESC, xp DESC)
        )
    `);

    // Scheduled messages table
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS scheduled_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            guild_id VARCHAR(20) NOT NULL,
            name VARCHAR(100) NOT NULL,
            message TEXT NOT NULL,
            channel_id VARCHAR(20) NOT NULL,
            interval_hours INT NOT NULL,
            last_sent BIGINT DEFAULT 0,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_name_guild (guild_id, name)
        )
    `);

    // Stats channels table
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS stats_channels (
            id INT AUTO_INCREMENT PRIMARY KEY,
            guild_id VARCHAR(20) NOT NULL UNIQUE,
            member_channel_name VARCHAR(100) NOT NULL,
            role_channel_name VARCHAR(100) NOT NULL,
            role_id VARCHAR(20) NOT NULL,
            category_id VARCHAR(20) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    // Level roles table
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS level_roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            guild_id VARCHAR(20) NOT NULL,
            level INT NOT NULL,
            role_id VARCHAR(20) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_guild_level (guild_id, level)
        )
    `);
}

// Get database connection
export function getConnection(): mysql.Connection {
    if (!connection) {
        throw new Error('Database not connected. Call initializeDatabase() first.');
    }
    return connection;
}

// Close database connection
export async function closeDatabase(): Promise<void> {
    if (connection) {
        await connection.end();
        connection = null;
        console.log('📴 Database connection closed');
    }
}
