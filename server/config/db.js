   // config/db.js

const { Pool } = require('pg');

// Load environment variables for database connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || process.env.DB_DATABASE || 'fraud_detection',
    password: String(process.env.DB_PASSWORD || ''),
    port: parseInt(process.env.DB_PORT) || 5432,
    // SSL configuration
    ssl: (process.env.DB_SSL || 'false').toString().toLowerCase() === 'true' ? { rejectUnauthorized: false } : false,
    // Optional: max clients, idle timeout, etc.
    max: 20, // Max number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 10000, // How long to wait for a connection to be established (increased from 5000)
    query_timeout: 30000, // Query timeout in milliseconds
});

// Event listener for database connection errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    console.error(err.stack);
    process.exit(-1); // Exit the process if a critical error occurs
});

// Test the database connection
// This IIFE runs immediately but does not block the main thread.
// The actual pool object is available immediately, but its ability to connect
// might have a subtle timing issue if not explicitly awaited in app.js
(async () => {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to PostgreSQL database!');
        client.release(); // Release the client back to the pool
    } catch (err) {
        console.error('Database connection failed:', err.message);
        console.error('\n🔧 Database Configuration Check:');
        console.error(`   Host: ${process.env.DB_HOST || 'localhost'}`);
        console.error(`   Port: ${process.env.DB_PORT || 5432}`);
        console.error(`   Database: ${process.env.DB_NAME || process.env.DB_DATABASE || 'fraud_detection'}`);
        console.error(`   User: ${process.env.DB_USER || 'postgres'}`);
        console.error(`   Password: ${process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]'}`);
        console.error('\n💡 Quick Fix Options:');
        console.error('   1. Update your .env file with correct PostgreSQL credentials');
        console.error('   2. Ensure PostgreSQL is running on your system');
        console.error('   3. Create the database if it doesn\'t exist');
        console.error('   4. Check if the password is correct for the postgres user');
        console.error('\n📋 Common Solutions:');
        console.error('   • Set DB_PASSWORD=your_actual_postgres_password in .env');
        console.error('   • Create database: CREATE DATABASE fraud_detection;');
        console.error('   • Reset postgres password if needed');
        // Optionally, exit the process if DB connection is critical for app startup
        // process.exit(1);
    }
})();

module.exports = {
    pool,
    // You can also export a function to get a client directly if needed for transactions
    getClient: () => pool.connect(),
};
