// server/utils/initDb.js
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { pool } = require('../config/db');

async function initializeDatabase() {
    console.log('Attempting to initialize database tables...');

    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        // Ensure required extensions
        await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");

        // Drop tables in a specific order to handle foreign key dependencies
        await client.query('DROP TABLE IF EXISTS anomalies CASCADE;');
        await client.query('DROP TABLE IF EXISTS transactions CASCADE;');
        await client.query('DROP TABLE IF EXISTS users CASCADE;');
        await client.query('DROP TABLE IF EXISTS audit_logs CASCADE;');
        await client.query('DROP TABLE IF EXISTS app_settings CASCADE;');
        await client.query('DROP TABLE IF EXISTS rules CASCADE;');

        // Users Table
        await client.query(`
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'viewer',
                name VARCHAR(255),
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP WITH TIME ZONE
            );
        `);
        console.log('Table "users" created.');

        // Transactions Table
        await client.query(`
            CREATE TABLE transactions (
                transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                amount DECIMAL(18, 2) NOT NULL,
                currency VARCHAR(10) NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'pending',
                merchant_id VARCHAR(255),
                transaction_type VARCHAR(100),
                ip_address VARCHAR(45),
                is_fraud BOOLEAN DEFAULT FALSE,
                description TEXT,
                sender_account VARCHAR(255),
                receiver_account VARCHAR(255),
                location_city VARCHAR(255),
                location_country VARCHAR(255),
                device_type VARCHAR(100),
                os_type VARCHAR(100),
                merchant_category VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                time_since_last_txn_sec INT,
                is_new_location BOOLEAN DEFAULT FALSE,
                is_new_device BOOLEAN DEFAULT FALSE,
                transaction_hour_of_day INT,
                transaction_day_of_week INT,
                user_total_transactions INT,
                user_total_amount_spent DECIMAL(18,2),
                risk_score DECIMAL(5, 2) DEFAULT 0.0,
                -- Malawi-specific telecom fields
                sender_msisdn VARCHAR(20),
                receiver_msisdn VARCHAR(20),
                telco_provider VARCHAR(20) CHECK (telco_provider IN ('TNM','Airtel'))
            );
        `);
        console.log('Table "transactions" created.');

        // Anomalies Table (replaces alerts)
        await client.query(`
            CREATE TABLE anomalies (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                rule_name VARCHAR(255) NOT NULL,
                description TEXT,
                severity VARCHAR(50) DEFAULT 'Medium',
                status VARCHAR(50) DEFAULT 'open',
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                transaction_id UUID REFERENCES transactions(transaction_id) ON DELETE SET NULL,
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                transaction_data JSONB,
                risk_score DECIMAL(5, 2) DEFAULT 0.0,
                comments JSONB,
                resolved_at TIMESTAMP WITH TIME ZONE,
                resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
                triggered_by JSONB,
                resolution_notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Table "anomalies" created.');

        // AuditLogs Table
        await client.query(`
            CREATE TABLE audit_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                username VARCHAR(255),
                action_type VARCHAR(100) NOT NULL,
                entity_type VARCHAR(100),
                entity_id UUID,
                description TEXT,
                details JSONB,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(45),
                user_agent TEXT,
                resource_type VARCHAR(100),
                resource_id UUID,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Table "audit_logs" created.');

        // App Settings Table (JSONB by category)
        await client.query(`
            CREATE TABLE app_settings (
                category VARCHAR(100) PRIMARY KEY,
                data JSONB NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Table "app_settings" created.');

        // Rules Table
        await client.query(`
            CREATE TABLE rules (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                rule_name VARCHAR(255) NOT NULL UNIQUE,
                description TEXT,
                criteria JSONB NOT NULL,
                action_type VARCHAR(100) NOT NULL,
                severity VARCHAR(50) DEFAULT 'medium',
                status VARCHAR(50) DEFAULT 'active',
                created_by UUID REFERENCES users(id) ON DELETE SET NULL,
                last_modified_by UUID REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Table "rules" created.');

        // Indexes for performance (as recommended in models)
        await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions (timestamp DESC);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type ON transactions (transaction_type);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_is_fraud ON transactions (is_fraud);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_merchant_category ON transactions (merchant_category);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions (amount);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_location_city ON transactions (location_city);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_location_country ON transactions (location_country);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_anomalies_timestamp ON anomalies (timestamp DESC);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_anomalies_transaction_id ON anomalies (transaction_id);`);

        // --- Insert User and Dummy Data ---
        await client.query(`
            INSERT INTO users (username, email, password_hash, role)
            VALUES
            ('chico_user', 'chico@example.com', '$2b$10$qPVm9PZCet7a00yCRjgu0./Fo4UEN9q1llRu2SyGwIMgE1ueHqrhK', 'admin')
            ON CONFLICT (email) DO UPDATE SET role = 'admin';
        `);

        const chicoUserResult = await client.query(`
            SELECT id FROM users WHERE email = 'chico@example.com';
        `);
        const userId = chicoUserResult.rows[0].id;

        if (userId) {
            await client.query(`
                INSERT INTO transactions (
                    user_id, amount, currency, status, transaction_type,
                    location_city, location_country, device_type, os_type,
                    description, is_fraud, time_since_last_txn_sec,
                    is_new_location, is_new_device, transaction_hour_of_day,
                    transaction_day_of_week, user_total_transactions,
                    user_total_amount_spent, risk_score, sender_msisdn, receiver_msisdn, telco_provider
                ) VALUES
                ('${userId}', 5000.00, 'MWK', 'completed', 'mobile_transfer', 'Blantyre', 'Malawi', 'mobile', 'Android',
                'payment', FALSE, 1200, FALSE, FALSE, 10, 2, 50, 250000.00, 10.5, '265888123456', '265999123456', 'TNM'),
                ('${userId}', 150000.00, 'MWK', 'completed', 'mobile_transfer', 'Lilongwe', 'Malawi', 'web', 'Windows',
                'online_purchase', TRUE, 50, TRUE, TRUE, 15, 4, 15, 100000.00, 95.0, '265888654321', '265999654321', 'Airtel'),
                ('${userId}', 25000.00, 'MWK', 'completed', 'withdrawal', 'Blantyre', 'Malawi', 'mobile', 'iOS',
                'cash_out', FALSE, 3600, FALSE, FALSE, 12, 1, 120, 750000.00, 2.3, '265888777777', '265999777777', 'TNM');
            `);
            console.log('Dummy data inserted into "transactions" table.');
        }

        // Add resolver_info column to existing anomalies table if it doesn't exist
        await client.query(`
            ALTER TABLE anomalies 
            ADD COLUMN IF NOT EXISTS resolver_info JSONB;
        `);
        console.log('Added resolver_info column to anomalies table if it did not exist.');

        await client.query('COMMIT');
        console.log('Database initialization complete: All tables are ready and populated with initial data.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Failed to initialize database tables:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Function to add resolver_info column to existing database
async function addResolverInfoColumn() {
    console.log('Adding resolver_info column to existing anomalies table...');
    const client = await pool.connect();
    try {
        await client.query(`
            ALTER TABLE anomalies 
            ADD COLUMN IF NOT EXISTS resolver_info JSONB;
        `);
        console.log('Successfully added resolver_info column to anomalies table.');
    } catch (error) {
        console.error('Error adding resolver_info column:', error);
        throw error;
    } finally {
        client.release();
    }
}

if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('Database setup script executed successfully.');
            process.exit(0);
        })
        .catch(err => {
            console.error('Database setup script failed:', err);
            process.exit(1);
        });
}

module.exports = { initializeDatabase, addResolverInfoColumn };
