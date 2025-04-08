const fs = require('fs');
const path = require('path');
const db = require('./config');

async function initializeDatabase() {
    try {
        // Read the schema file
        const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        
        // Execute the schema
        await db.query(schemaSQL);
        console.log('Database initialized successfully');

        // Test query to verify tables
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('\nCreated tables:', tables.map(t => t.table_name));

    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        process.exit();
    }
}

initializeDatabase(); 