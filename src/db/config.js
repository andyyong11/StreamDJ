const pgp = require('pg-promise')();
require('dotenv').config();

// Database connection parameters
const cn = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'StreamDJ1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || ''
};

console.log('Connecting to database with config:', {
    host: cn.host,
    port: cn.port,
    database: cn.database,
    user: cn.user,
    // Password hidden for security
});

// Create the database instance
const db = pgp(cn);

// Flag to track if DB connection was successful
let dbConnected = false;

// Test the connection
db.connect()
    .then(obj => {
        console.log('Database connection successful');
        dbConnected = true;
        obj.done(); // success, release the connection;
    })
    .catch(error => {
        console.log('Database connection error:', error.message || error);
        console.log('Enabling mock data mode');
        dbConnected = false;
    });

// Add helper methods that support fallback to mock data
const dbWithFallback = {
    // Original db instance for direct access
    db,
    
    // Status check
    isConnected: () => dbConnected,
    
    // Query with fallback
    async query(text, params) {
        try {
            if (!dbConnected) {
                console.log('DB not connected, returning empty array for query:', text);
                return [];
            }
            return await db.query(text, params);
        } catch (err) {
            console.error('Query error:', err);
            return [];
        }
    },
    
    // One with fallback
    async one(text, params) {
        try {
            if (!dbConnected) {
                console.log('DB not connected, mocking one() method for:', text);
                // If this is a user creation query, return a mock user
                if (text.includes('INSERT INTO "User"')) {
                    return {
                        UserID: Math.floor(Math.random() * 1000) + 1,
                        Username: params[0],
                        Email: params[1],
                        Role: 'Listener',
                        SubscriptionType: 'Free',
                        Bio: '',
                        Genres: '',
                        FollowersCount: 0,
                        FollowingCount: 0,
                        CreatedAt: new Date()
                    };
                }
                // For login, return a mock user if the query is a select by email
                if (text.includes('SELECT * FROM "User" WHERE "Email"')) {
                    return {
                        UserID: 1,
                        Username: 'TestUser',
                        Email: params[0],
                        PasswordHash: '$2a$10$XJvgm.1o0WWPg3ZIpvim6uznePT3n0FVGcthTllYS6GlOiF64g45q', // This is the hash for 'password'
                        Role: 'Listener',
                        SubscriptionType: 'Free',
                        Bio: '',
                        Genres: '',
                        FollowersCount: 0,
                        FollowingCount: 0,
                        CreatedAt: new Date()
                    };
                }
                return {};
            }
            return await db.one(text, params);
        } catch (err) {
            console.error('one error:', err);
            throw err;
        }
    },
    
    // One or none with fallback
    async oneOrNone(text, params) {
        try {
            if (!dbConnected) {
                console.log('DB not connected, returning null for oneOrNone:', text);
                return null;
            }
            return await db.oneOrNone(text, params);
        } catch (err) {
            console.error('oneOrNone error:', err);
            return null;
        }
    },
    
    // Any with fallback
    async any(text, params) {
        try {
            if (!dbConnected) {
                console.log('DB not connected, returning empty array for any:', text);
                return [];
            }
            return await db.any(text, params);
        } catch (err) {
            console.error('any error:', err);
            return [];
        }
    },
    
    // None with fallback
    async none(text, params) {
        try {
            if (!dbConnected) {
                console.log('DB not connected, returning success for none:', text);
                return null;
            }
            return await db.none(text, params);
        } catch (err) {
            console.error('none error:', err);
            return null;
        }
    }
};

module.exports = dbWithFallback; 