

require('dotenv').config();
const { pool } = require('../config/db');
const {
    generateMalawiTransaction,
    generateBatchMalawiTransactions,
    generateMalawiPhoneNumber,
    generateTNMReference,
    generateAirtelTransactionId,
    PROVIDERS
} = require('../utils/malawiTransactionGenerator');

async function updateExistingTransactions() {
    const client = await pool.connect();

    try {
        console.log('🇲🇼 Starting Malawi transaction update...');

        // Get all existing transactions
        const existingTransactions = await client.query('SELECT * FROM transactions ORDER BY created_at DESC');
        console.log(`Found ${existingTransactions.rows.length} existing transactions to update`);

        let updateCount = 0;

        for (const transaction of existingTransactions.rows) {
            // Generate new Malawi-style transaction ID
            const provider = Math.random() > 0.5 ? PROVIDERS.TNM_MPAMBA : PROVIDERS.AIRTEL_MONEY;
            let newTransactionId;

            if (provider === PROVIDERS.TNM_MPAMBA) {
                newTransactionId = generateTNMReference();
            } else {
                newTransactionId = generateAirtelTransactionId();
            }

            // Generate Malawi phone numbers for sender and receiver
            const senderMsisdn = generateMalawiPhoneNumber();
            const receiverMsisdn = generateMalawiPhoneNumber();

            // Update the transaction
            await client.query(`
                UPDATE transactions
                SET
                    transaction_id = $1,
                    sender_msisdn = $2,
                    receiver_msisdn = $3,
                    telco_provider = $4,
                    currency = 'MWK',
                    updated_at = NOW()
                WHERE id = $5
            `, [newTransactionId, senderMsisdn, receiverMsisdn, provider, transaction.id]);

            updateCount++;

            if (updateCount % 100 === 0) {
                console.log(`Updated ${updateCount} transactions...`);
            }
        }

        console.log(`✅ Successfully updated ${updateCount} transactions with Malawi data`);

    } catch (error) {
        console.error('❌ Error updating transactions:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function updateExistingUsers() {
    const client = await pool.connect();

    try {
        console.log('🇲🇼 Starting Malawi user update...');

        // Get all existing users
        const existingUsers = await client.query('SELECT * FROM users ORDER BY created_at DESC');
        console.log(`Found ${existingUsers.rows.length} existing users to update`);

        let updateCount = 0;

        for (const user of existingUsers.rows) {
            // Generate Malawi phone number as new user ID
            const malawiPhone = generateMalawiPhoneNumber();

            // Update the user (keep original username but add phone)
            await client.query(`
                UPDATE users
                SET
                    phone = $1,
                    updated_at = NOW()
                WHERE id = $2
            `, [malawiPhone, user.id]);

            updateCount++;
        }

        console.log(`✅ Successfully updated ${updateCount} users with Malawi phone numbers`);

    } catch (error) {
        console.error('❌ Error updating users:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function generateNewMalawiTransactions(count = 500) {
    const client = await pool.connect();

    try {
        console.log(`🇲🇼 Generating ${count} new Malawi transactions...`);

        // Generate batch of Malawi transactions
        const malawiTransactions = generateBatchMalawiTransactions(count);

        // Get existing user IDs to assign transactions to
        const usersResult = await client.query('SELECT id FROM users LIMIT 50');
        const userIds = usersResult.rows.map(row => row.id);

        if (userIds.length === 0) {
            console.log('No users found. Please create users first.');
            return;
        }

        // Insert new transactions
        let insertCount = 0;

        for (const txn of malawiTransactions) {
            // Assign random user ID
            const userId = userIds[Math.floor(Math.random() * userIds.length)];

            try {
                await client.query(`
                    INSERT INTO transactions (
                        transaction_id, user_id, amount, currency, timestamp, status,
                        transaction_type, description, location_city, location_country,
                        sender_msisdn, receiver_msisdn, telco_provider,
                        sender_account, receiver_account,
                        created_at, updated_at, is_fraud
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
                    )
                `, [
                    txn.transaction_id,
                    userId,
                    txn.amount,
                    txn.currency,
                    txn.created_at,
                    txn.status,
                    txn.transaction_type,
                    txn.description,
                    txn.location || 'Lilongwe',
                    'Malawi',
                    txn.sender_phone,
                    txn.receiver_phone,
                    txn.provider,
                    txn.sender_phone, // Use phone as account
                    txn.receiver_phone, // Use phone as account
                    txn.created_at,
                    txn.created_at,
                    Math.random() < 0.05 // 5% fraud rate
                ]);

                insertCount++;

                if (insertCount % 100 === 0) {
                    console.log(`Inserted ${insertCount} transactions...`);
                }

            } catch (insertError) {
                console.warn(`Failed to insert transaction ${txn.transaction_id}:`, insertError.message);
            }
        }

        console.log(`✅ Successfully generated ${insertCount} new Malawi transactions`);

    } catch (error) {
        console.error('❌ Error generating transactions:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function addPhoneColumnToUsers() {
    const client = await pool.connect();

    try {
        console.log('🔧 Adding phone column to users table...');

        await client.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS phone VARCHAR(20)
        `);

        console.log('✅ Phone column added to users table');

    } catch (error) {
        console.error('❌ Error adding phone column:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    try {
        console.log('🇲🇼 Starting Malawi Mobile Money Data Update');
        console.log('==========================================');

        // Add phone column to users table
        await addPhoneColumnToUsers();

        // Update existing users with phone numbers
        await updateExistingUsers();

        // Update existing transactions with Malawi IDs
        await updateExistingTransactions();

        // Generate new Malawi transactions
        await generateNewMalawiTransactions(300);

        console.log('==========================================');
        console.log('🎉 Malawi Mobile Money Data Update Complete!');
        console.log('');
        console.log('📊 Summary:');
        console.log('- Updated existing transactions with Malawi transaction IDs');
        console.log('- Updated existing users with Malawi phone numbers');
        console.log('- Generated 300 new authentic Malawi transactions');
        console.log('- Transaction IDs now follow TNM Mpamba and Airtel Money formats');
        console.log('- User IDs now include Malawi phone numbers (265 country code)');
        console.log('');
        console.log('🔍 Transaction ID Examples:');
        console.log('- TNM Mpamba: CHB629WCL7I, CH6629I9G70, CGS028TD95E');
        console.log('- Airtel Money: CO250917.1058.B49830, PP250911.0430.Y00084');
        console.log('');
        console.log('📱 Phone Number Examples:');
        console.log('- 265888336810, 265885353389, 265880287483');

    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    updateExistingTransactions,
    updateExistingUsers,
    generateNewMalawiTransactions,
    addPhoneColumnToUsers
};
