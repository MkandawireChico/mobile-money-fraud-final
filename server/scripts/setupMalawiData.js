

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const {
    generateBatchMalawiTransactions,
    generateMalawiPhoneNumber,
    generateMalawiName,
    PROVIDERS
} = require('../utils/malawiTransactionGenerator');

async function executeSQLFile(filePath) {
    const client = await pool.connect();

    try {
        console.log(`📄 Executing SQL file: ${filePath}`);
        const sqlContent = fs.readFileSync(filePath, 'utf8');
        await client.query(sqlContent);
        console.log(`✅ Successfully executed ${path.basename(filePath)}`);
    } catch (error) {
        console.error(`❌ Error executing ${filePath}:`, error.message);
        throw error;
    } finally {
        client.release();
    }
}

async function createMalawiUsers(count = 50) {
    const client = await pool.connect();

    try {
        console.log(`👥 Creating ${count} Malawi users...`);

        const providers = Object.values(PROVIDERS);
        let createdCount = 0;

        for (let i = 0; i < count; i++) {
            const phone = generateMalawiPhoneNumber();
            const name = generateMalawiName();
            const [firstName, lastName] = name.split(' ');
            const provider = providers[Math.floor(Math.random() * providers.length)];
            const role = Math.random() < 0.1 ? 'admin' : (Math.random() < 0.3 ? 'analyst' : 'viewer');

            // Create email from name
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${provider === PROVIDERS.TNM_MPAMBA ? 'tnm' : 'airtel'}.mw`;
            const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${phone.slice(-4)}`;

            try {
                await client.query(`
                    INSERT INTO users (
                        username, email, password_hash, role, status,
                        phone, msisdn, mobile_money_provider,
                        created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
                    )
                `, [
                    username,
                    email,
                    '$2a$10$defaulthashfordemopurposes', // Default hash for demo
                    role,
                    'active',
                    phone,
                    phone,
                    provider,
                    new Date(),
                    new Date()
                ]);

                createdCount++;

            } catch (insertError) {
                if (!insertError.message.includes('duplicate key')) {
                    console.warn(`Failed to create user ${username}:`, insertError.message);
                }
            }
        }

        console.log(`✅ Created ${createdCount} Malawi users`);

    } catch (error) {
        console.error('❌ Error creating users:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function generateComprehensiveMalawiTransactions(count = 1000) {
    const client = await pool.connect();

    try {
        console.log(`💰 Generating ${count} comprehensive Malawi transactions...`);

        // Get all users
        const usersResult = await client.query('SELECT id, phone, mobile_money_provider FROM users WHERE phone IS NOT NULL');
        const users = usersResult.rows;

        if (users.length === 0) {
            console.log('No users with phone numbers found. Creating users first...');
            await createMalawiUsers(50);
            const newUsersResult = await client.query('SELECT id, phone, mobile_money_provider FROM users WHERE phone IS NOT NULL');
            users.push(...newUsersResult.rows);
        }

        // Generate transactions
        const malawiTransactions = generateBatchMalawiTransactions(count);
        let insertCount = 0;

        for (const txn of malawiTransactions) {
            // Assign random user
            const user = users[Math.floor(Math.random() * users.length)];

            // Calculate realistic balances
            const balanceBefore = Math.floor(Math.random() * 100000) + 1000; // 1K to 100K MWK
            const balanceAfter = txn.transaction_type === 'money_received' || txn.transaction_type === 'cash_in'
                ? balanceBefore + txn.amount
                : balanceBefore - txn.amount - txn.fee;

            try {
                await client.query(`
                    INSERT INTO transactions (
                        transaction_id, user_id, amount, currency, timestamp, status,
                        transaction_type, description, location_city, location_country,
                        sender_msisdn, receiver_msisdn, telco_provider, agent_code,
                        reference_number, transaction_fee, balance_before, balance_after,
                        sender_account, receiver_account, created_at, updated_at, is_fraud
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
                    )
                `, [
                    txn.transaction_id,
                    user.id,
                    txn.amount,
                    'MWK',
                    txn.created_at,
                    txn.status,
                    txn.transaction_type,
                    txn.description,
                    txn.location || 'Lilongwe',
                    'Malawi',
                    txn.sender_phone,
                    txn.receiver_phone,
                    txn.provider,
                    txn.agentCode,
                    txn.transaction_id, // Use transaction_id as reference
                    txn.fee,
                    balanceBefore,
                    balanceAfter,
                    txn.sender_phone,
                    txn.receiver_phone,
                    txn.created_at,
                    txn.created_at,
                    Math.random() < 0.03 // 3% fraud rate
                ]);

                insertCount++;

                if (insertCount % 200 === 0) {
                    console.log(`📊 Inserted ${insertCount} transactions...`);
                }

            } catch (insertError) {
                if (!insertError.message.includes('duplicate key')) {
                    console.warn(`Failed to insert transaction ${txn.transaction_id}:`, insertError.message);
                }
            }
        }

        console.log(`✅ Successfully generated ${insertCount} Malawi transactions`);

    } catch (error) {
        console.error('❌ Error generating transactions:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function updateExistingDataToMalawi() {
    const client = await pool.connect();

    try {
        console.log('🔄 Updating existing data to Malawi format...');

        // Update existing transactions to MWK
        await client.query(`
            UPDATE transactions
            SET currency = 'MWK', location_country = 'Malawi'
            WHERE currency != 'MWK' OR location_country != 'Malawi'
        `);

        // Update existing users without phone numbers
        const usersWithoutPhone = await client.query('SELECT id FROM users WHERE phone IS NULL');

        for (const user of usersWithoutPhone.rows) {
            const phone = generateMalawiPhoneNumber();
            const provider = Math.random() > 0.5 ? PROVIDERS.TNM_MPAMBA : PROVIDERS.AIRTEL_MONEY;

            await client.query(`
                UPDATE users
                SET phone = $1, msisdn = $1, mobile_money_provider = $2
                WHERE id = $3
            `, [phone, provider, user.id]);
        }

        console.log('✅ Updated existing data to Malawi format');

    } catch (error) {
        console.error('❌ Error updating existing data:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function generateSummaryStats() {
    const client = await pool.connect();

    try {
        console.log('📊 Generating summary statistics...');

        // Transaction statistics
        const txnStats = await client.query(`
            SELECT
                COUNT(*) as total_transactions,
                COUNT(CASE WHEN telco_provider = 'tnm_mpamba' THEN 1 END) as tnm_transactions,
                COUNT(CASE WHEN telco_provider = 'airtel_money' THEN 1 END) as airtel_transactions,
                SUM(amount) as total_amount,
                AVG(amount) as avg_amount,
                COUNT(CASE WHEN is_fraud = true THEN 1 END) as fraud_transactions
            FROM transactions
            WHERE currency = 'MWK'
        `);

        // User statistics
        const userStats = await client.query(`
            SELECT
                COUNT(*) as total_users,
                COUNT(CASE WHEN mobile_money_provider = 'tnm_mpamba' THEN 1 END) as tnm_users,
                COUNT(CASE WHEN mobile_money_provider = 'airtel_money' THEN 1 END) as airtel_users,
                COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
                COUNT(CASE WHEN role = 'analyst' THEN 1 END) as analyst_users
            FROM users
            WHERE phone IS NOT NULL
        `);

        const txn = txnStats.rows[0];
        const usr = userStats.rows[0];

        console.log('\n📈 MALAWI MOBILE MONEY STATISTICS');
        console.log('=====================================');
        console.log(`👥 Total Users: ${usr.total_users}`);
        console.log(`📱 TNM Mpamba Users: ${usr.tnm_users}`);
        console.log(`📱 Airtel Money Users: ${usr.airtel_users}`);
        console.log(`👨‍💼 Admin Users: ${usr.admin_users}`);
        console.log(`👨‍🔬 Analyst Users: ${usr.analyst_users}`);
        console.log('');
        console.log(`💰 Total Transactions: ${txn.total_transactions}`);
        console.log(`📱 TNM Mpamba Transactions: ${txn.tnm_transactions}`);
        console.log(`📱 Airtel Money Transactions: ${txn.airtel_transactions}`);
        console.log(`💵 Total Amount: ${parseFloat(txn.total_amount || 0).toLocaleString()} MWK`);
        console.log(`💵 Average Amount: ${parseFloat(txn.avg_amount || 0).toFixed(2)} MWK`);
        console.log(`🚨 Fraud Transactions: ${txn.fraud_transactions}`);
        console.log(`📊 Fraud Rate: ${((txn.fraud_transactions / txn.total_transactions) * 100).toFixed(2)}%`);

    } catch (error) {
        console.error('❌ Error generating statistics:', error);
    } finally {
        client.release();
    }
}

async function main() {
    try {
        console.log('🇲🇼 MALAWI MOBILE MONEY SETUP');
        console.log('==============================');
        console.log('Setting up authentic Malawi mobile money data...\n');

        // 1. Execute SQL schema updates
        const sqlFilePath = path.join(__dirname, 'addMalawiColumns.sql');
        await executeSQLFile(sqlFilePath);

        // 2. Update existing data
        await updateExistingDataToMalawi();

        // 3. Create Malawi users
        await createMalawiUsers(100);

        // 4. Generate comprehensive transactions
        await generateComprehensiveMalawiTransactions(1500);

        // 5. Generate summary statistics
        await generateSummaryStats();

        console.log('\n🎉 MALAWI MOBILE MONEY SETUP COMPLETE!');
        console.log('=====================================');
        console.log('✅ Database schema updated with Malawi-specific columns');
        console.log('✅ Created 100 Malawi users with authentic phone numbers');
        console.log('✅ Generated 1500 realistic Malawi mobile money transactions');
        console.log('✅ Transaction IDs follow TNM Mpamba and Airtel Money formats');
        console.log('✅ Phone numbers use Malawi country code (265)');
        console.log('✅ Amounts and fees reflect realistic Malawi mobile money patterns');
        console.log('');
        console.log('🔍 Example Transaction IDs:');
        console.log('- TNM Mpamba: CHB629WCL7I, CH6629I9G70, CGS028TD95E');
        console.log('- Airtel Money: CO250917.1058.B49830, PP250911.0430.Y00084');
        console.log('');
        console.log('📱 Example Phone Numbers:');
        console.log('- 265888336810, 265885353389, 265880287483');
        console.log('');
        console.log('🚀 Your fraud detection system now has authentic Malawi data!');

    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the setup
if (require.main === module) {
    main();
}

module.exports = {
    executeSQLFile,
    createMalawiUsers,
    generateComprehensiveMalawiTransactions,
    updateExistingDataToMalawi,
    generateSummaryStats
};
