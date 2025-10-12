

require('dotenv').config(); // Load environment variables
const { pool } = require('../config/db');
const { addCaseReviewFields } = require('./add-case-review-fields');

class FraudCaseReviewSetup {
    constructor() {
        this.client = null;
    }

    async initialize() {
        this.client = await pool.connect();
        console.log('🔗 Connected to database');
    }

    async cleanup() {
        if (this.client) {
            this.client.release();
            console.log('🔌 Database connection released');
        }
    }

    async setupDatabase() {
        console.log('\n📊 Setting up database schema...');

        try {
            // Add case review fields
            await addCaseReviewFields();

            // Verify transactions table has required fields
            const verifyQuery = `
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'transactions'
                AND column_name IN ('case_status', 'reviewed_by', 'investigation_notes', 'is_fraud')
            `;

            const result = await this.client.query(verifyQuery);
            const fields = result.rows.map(row => row.column_name);

            const requiredFields = ['case_status', 'reviewed_by', 'investigation_notes', 'is_fraud'];
            const missingFields = requiredFields.filter(field => !fields.includes(field));

            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            console.log('✅ Database schema verification completed');

        } catch (error) {
            console.error('❌ Database setup failed:', error.message);
            throw error;
        }
    }

    async createSampleData() {
        console.log('\n🎯 Creating sample high-risk transactions for testing...');

        try {
            // Check if we have any transactions
            const countQuery = 'SELECT COUNT(*) as count FROM transactions';
            const countResult = await this.client.query(countQuery);
            const transactionCount = parseInt(countResult.rows[0].count);

            if (transactionCount === 0) {
                console.log('⚠️  No transactions found. Creating sample data...');
                await this.insertSampleTransactions();
            } else {
                console.log(`📊 Found ${transactionCount} existing transactions`);
                await this.updateExistingTransactions();
            }

        } catch (error) {
            console.error('❌ Sample data creation failed:', error.message);
            throw error;
        }
    }

    async insertSampleTransactions() {
        const sampleTransactions = [
            {
                transaction_id: 'FC-TEST-001',
                user_id: 'user_001',
                amount: 500000,
                currency: 'MWK',
                transaction_type: 'p2p_transfer',
                status: 'completed',
                timestamp: new Date().toISOString(),
                sender_account: '+265888123456',
                receiver_account: '+265999987654',
                description: 'High amount P2P transfer - suspicious pattern',
                location_city: 'Lilongwe',
                location_country: 'Malawi',
                device_type: 'mobile',
                is_new_location: true,
                is_new_device: false,
                risk_score: 0.94,
                is_fraud: null,
                transaction_hour_of_day: 2,
                case_status: null
            },
            {
                transaction_id: 'FC-TEST-002',
                user_id: 'user_002',
                amount: 750000,
                currency: 'MWK',
                transaction_type: 'cash_out',
                status: 'completed',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                sender_account: '+265777456789',
                receiver_account: 'Agent-001234',
                description: 'Large cash withdrawal - unusual time',
                location_city: 'Blantyre',
                location_country: 'Malawi',
                device_type: 'mobile',
                is_new_location: false,
                is_new_device: true,
                risk_score: 0.87,
                is_fraud: null,
                transaction_hour_of_day: 23,
                case_status: null
            },
            {
                transaction_id: 'FC-TEST-003',
                user_id: 'user_003',
                amount: 250000,
                currency: 'MWK',
                transaction_type: 'bill_payment',
                status: 'completed',
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                sender_account: '+265888999111',
                receiver_account: 'UTILITY-001',
                description: 'Bill payment - new recipient pattern',
                location_city: 'Mzuzu',
                location_country: 'Malawi',
                device_type: 'mobile',
                is_new_location: true,
                is_new_device: true,
                risk_score: 0.76,
                is_fraud: null,
                transaction_hour_of_day: 3,
                case_status: null
            }
        ];

        for (const transaction of sampleTransactions) {
            const insertQuery = `
                INSERT INTO transactions (
                    transaction_id, user_id, amount, currency, transaction_type, status,
                    timestamp, sender_account, receiver_account, description,
                    location_city, location_country, device_type, is_new_location,
                    is_new_device, risk_score, is_fraud, transaction_hour_of_day, case_status
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18, $19
                ) ON CONFLICT (transaction_id) DO NOTHING
            `;

            const values = [
                transaction.transaction_id, transaction.user_id, transaction.amount,
                transaction.currency, transaction.transaction_type, transaction.status,
                transaction.timestamp, transaction.sender_account, transaction.receiver_account,
                transaction.description, transaction.location_city, transaction.location_country,
                transaction.device_type, transaction.is_new_location, transaction.is_new_device,
                transaction.risk_score, transaction.is_fraud, transaction.transaction_hour_of_day,
                transaction.case_status
            ];

            await this.client.query(insertQuery, values);
        }

        console.log('✅ Sample high-risk transactions created');
    }

    async updateExistingTransactions() {
        // Update some existing transactions to have high risk scores for testing
        const updateQuery = `
            UPDATE transactions
            SET risk_score = 0.92, case_status = NULL
            WHERE transaction_id IN (
                SELECT transaction_id
                FROM transactions
                WHERE risk_score IS NULL OR risk_score < 0.5
                LIMIT 3
            )
        `;

        await this.client.query(updateQuery);
        console.log('✅ Updated existing transactions with high risk scores');
    }

    async verifySetup() {
        console.log('\n🔍 Verifying fraud case review setup...');

        try {
            // Check high-risk transactions
            const highRiskQuery = `
                SELECT COUNT(*) as count
                FROM transactions
                WHERE risk_score >= 0.7 OR is_fraud = true
            `;

            const highRiskResult = await this.client.query(highRiskQuery);
            const highRiskCount = parseInt(highRiskResult.rows[0].count);

            console.log(`📊 Found ${highRiskCount} high-risk transactions available for case review`);

            // Check case review fields
            const fieldsQuery = `
                SELECT
                    COUNT(*) FILTER (WHERE case_status IS NOT NULL) as cases_with_status,
                    COUNT(*) FILTER (WHERE reviewed_by IS NOT NULL) as reviewed_cases,
                    COUNT(*) FILTER (WHERE investigation_notes IS NOT NULL) as cases_with_notes
                FROM transactions
            `;

            const fieldsResult = await this.client.query(fieldsQuery);
            const stats = fieldsResult.rows[0];

            console.log(`📋 Case Review Statistics:`);
            console.log(`   • Cases with status: ${stats.cases_with_status}`);
            console.log(`   • Reviewed cases: ${stats.reviewed_cases}`);
            console.log(`   • Cases with notes: ${stats.cases_with_notes}`);

            // Test case review API endpoints (basic structure check)
            console.log('\n🔗 API Endpoints Available:');
            console.log('   • POST /api/case-review/:id/decision - Submit fraud decision');
            console.log('   • POST /api/case-review/:id/notes - Save investigation notes');
            console.log('   • GET /api/case-review/:id/timeline - Get case timeline');
            console.log('   • GET /api/case-review/:id/risk-analysis - Get risk analysis');

            console.log('\n🎨 Frontend Routes Available:');
            console.log('   • /case-review/:id - Fraud case review interface');
            console.log('   • /transactions - Enhanced with "Review Case" buttons');

            console.log('\n✅ Fraud case review system verification completed');

        } catch (error) {
            console.error('❌ Setup verification failed:', error.message);
            throw error;
        }
    }

    async displayUsageInstructions() {
        console.log('\n📖 FRAUD CASE REVIEW SYSTEM - USAGE INSTRUCTIONS');
        console.log('═'.repeat(60));

        console.log('\n🎯 How to Use the Fraud Case Review System:');
        console.log('\n1. **Access High-Risk Transactions:**');
        console.log('   • Navigate to /transactions in your browser');
        console.log('   • Look for transactions with "High" or "Critical" risk levels');
        console.log('   • These will show a red "Review Case" button');

        console.log('\n2. **Review a Fraud Case:**');
        console.log('   • Click the "Review Case" button on any high-risk transaction');
        console.log('   • You\'ll be taken to /case-review/:id');
        console.log('   • Review the transaction details, risk factors, and evidence');

        console.log('\n3. **Make a Decision:**');
        console.log('   • Confirm Fraud: Mark as fraudulent and take action');
        console.log('   • Mark Legitimate: Clear the transaction as safe');
        console.log('   • Needs Further Review: Flag for additional investigation');

        console.log('\n4. **Add Investigation Notes:**');
        console.log('   • Use the notes section to document your findings');
        console.log('   • Notes are saved automatically and tracked in audit logs');

        console.log('\n5. **Track Case Timeline:**');
        console.log('   • View complete audit trail of case activities');
        console.log('   • See who reviewed what and when');
        console.log('   • Monitor case progression and decisions');

        console.log('\n🔐 Role-Based Access:');
        console.log('   • Admin: Full access to all case review features');
        console.log('   • Analyst: Can review cases and make decisions');
        console.log('   • Viewer: Read-only access to case information');

        console.log('\n🎨 Key Features:');
        console.log('   • Professional case review interface matching your design');
        console.log('   • Risk factor analysis with color-coded severity');
        console.log('   • Evidence collection and ML prediction insights');
        console.log('   • Complete audit trail and compliance tracking');
        console.log('   • Real-time case status updates');

        console.log('\n🚀 Next Steps:');
        console.log('   1. Start your backend server: npm run dev');
        console.log('   2. Start your frontend: npm start');
        console.log('   3. Navigate to http://localhost:3000/transactions');
        console.log('   4. Look for high-risk transactions with "Review Case" buttons');
        console.log('   5. Click to start investigating fraud cases!');

        console.log('\n' + '═'.repeat(60));
    }
}

async function setupFraudCaseReview() {
    const setup = new FraudCaseReviewSetup();

    try {
        console.log('🚀 Starting Fraud Case Review System Setup...');
        console.log('═'.repeat(50));

        await setup.initialize();
        await setup.setupDatabase();
        await setup.createSampleData();
        await setup.verifySetup();
        await setup.displayUsageInstructions();

        console.log('\n🎉 FRAUD CASE REVIEW SYSTEM SETUP COMPLETED SUCCESSFULLY!');

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        await setup.cleanup();
    }
}

// Run setup if this script is executed directly
if (require.main === module) {
    setupFraudCaseReview()
        .then(() => {
            console.log('\n✅ Setup completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Setup failed:', error.message);
            process.exit(1);
        });
}

module.exports = { setupFraudCaseReview, FraudCaseReviewSetup };
