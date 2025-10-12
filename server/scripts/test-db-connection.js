

require('dotenv').config();
const { Pool } = require('pg');

async function testDatabaseConnection() {
    console.log('🔍 Testing Database Connection...');
    console.log('═'.repeat(40));

    console.log('📋 Configuration:');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || '5432'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'fraud_detection'}`);
    console.log(`   User: ${process.env.DB_USER || 'postgres'}`);
    console.log(`   Password: ${process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]'}`);

    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'fraud_detection',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        connectionTimeoutMillis: 10000,
        query_timeout: 30000,
    });

    let client;

    try {
        console.log('\n🔗 Attempting to connect...');
        client = await pool.connect();
        console.log('✅ Database connection successful!');

        // Test a simple query
        console.log('\n📊 Testing basic query...');
        const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
        console.log(`✅ Query successful! Current time: ${result.rows[0].current_time}`);
        console.log(`📋 PostgreSQL version: ${result.rows[0].postgres_version.split(' ')[0]}`);

        // Check if transactions table exists
        console.log('\n🔍 Checking for transactions table...');
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'transactions'
            );
        `);

        if (tableCheck.rows[0].exists) {
            console.log('✅ Transactions table found!');

            // Count transactions
            const countResult = await client.query('SELECT COUNT(*) as count FROM transactions');
            console.log(`📊 Found ${countResult.rows[0].count} transactions in the database`);
        } else {
            console.log('⚠️  Transactions table not found - this is normal for a fresh setup');
        }

        console.log('\n🎉 Database connection test completed successfully!');
        console.log('✅ Ready to run the fraud case review setup script');

    } catch (error) {
        console.error('\n❌ Database connection failed:');
        console.error(`   Error: ${error.message}`);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Possible solutions:');
            console.log('   1. Make sure PostgreSQL is running');
            console.log('   2. Check if the port 5432 is correct');
            console.log('   3. Verify PostgreSQL service is started');
        } else if (error.message.includes('password authentication failed')) {
            console.log('\n💡 Possible solutions:');
            console.log('   1. Check if the password "2397" is correct');
            console.log('   2. Verify the postgres user exists');
            console.log('   3. Try resetting the postgres password');
        } else if (error.message.includes('database') && error.message.includes('does not exist')) {
            console.log('\n💡 Database does not exist. Creating it...');
            await createDatabase();
        }

        throw error;
    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
    }
}

async function createDatabase() {
    console.log('\n🏗️  Attempting to create database...');

    // Connect to postgres database to create our target database
    const adminPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: 'postgres', // Connect to default postgres database
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
    });

    let client;

    try {
        client = await adminPool.connect();

        // Check if database exists
        const dbExists = await client.query(
            'SELECT 1 FROM pg_database WHERE datname = $1',
            [process.env.DB_NAME || 'fraud_detection']
        );

        if (dbExists.rows.length === 0) {
            // Create the database
            await client.query(`CREATE DATABASE "${process.env.DB_NAME || 'fraud_detection'}"`);
            console.log(`✅ Database "${process.env.DB_NAME || 'fraud_detection'}" created successfully!`);
        } else {
            console.log(`✅ Database "${process.env.DB_NAME || 'fraud_detection'}" already exists`);
        }

    } catch (error) {
        console.error('❌ Failed to create database:', error.message);
        throw error;
    } finally {
        if (client) {
            client.release();
        }
        await adminPool.end();
    }
}

// Run the test
if (require.main === module) {
    testDatabaseConnection()
        .then(() => {
            console.log('\n✅ Database test completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Database test failed');
            process.exit(1);
        });
}

module.exports = { testDatabaseConnection };
